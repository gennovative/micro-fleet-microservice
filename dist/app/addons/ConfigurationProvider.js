"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const cm = require("@micro-fleet/common");
const { SvcSettingKeys: S, ModuleNames: M, ActionNames: A } = cm.constants;
/**
 * Provides settings from appconfig.json, environmental variables and remote settings service.
 */
let ConfigurationProvider = class ConfigurationProvider {
    constructor() {
        this.name = 'ConfigurationProvider';
        this._configFilePath = `${process.cwd()}/appconfig.json`;
        this._remoteSettings = this._fileSettings = {};
        this._enableRemote = false;
        this._eventEmitter = new events_1.EventEmitter();
        this._isInit = false;
    }
    //#region Getters & Setters
    /**
     * @see IConfigurationProvider.enableRemote
     */
    get enableRemote() {
        return this._enableRemote;
    }
    set enableRemote(val) {
        this._enableRemote = val;
    }
    get refetchInterval() {
        return this._refetchInterval;
    }
    set refetchInterval(val) {
        this._refetchInterval = val;
        if (this._refetchTimer) {
            this.stopRefetch();
            this.repeatFetch();
        }
    }
    //#endregion Getters & Setters
    /**
     * @see IServiceAddOn.init
     */
    init() {
        if (this._isInit) {
            return Promise.resolve();
        }
        this._isInit = true;
        try {
            this._fileSettings = require(this._configFilePath);
        }
        catch (ex) {
            // TODO: Should use logger
            // console.warn(ex);
            this._fileSettings = {};
        }
        if (this.enableRemote) {
            this._rpcCaller.name = this.name;
            const addresses = this.applySettings();
            if (!addresses.hasValue) {
                return Promise.reject(new cm.CriticalException('No address for Settings Service!'));
            }
            this._addresses = addresses.value;
        }
        return Promise.resolve();
    }
    /**
     * @see IServiceAddOn.deadLetter
     */
    deadLetter() {
        return Promise.resolve();
    }
    /**
     * @see IServiceAddOn.dispose
     */
    dispose() {
        this.stopRefetch();
        this._configFilePath = null;
        this._fileSettings = null;
        this._remoteSettings = null;
        this._enableRemote = null;
        this._rpcCaller = null;
        this._eventEmitter = null;
        this._isInit = null;
        return Promise.resolve();
    }
    /**
     * @see IConfigurationProvider.get
     */
    get(key, dataType) {
        let value = this._remoteSettings[key];
        if (value === undefined && dataType) {
            value = this.parseValue(process.env[key] || this._fileSettings[key], dataType);
        }
        else if (value === undefined) {
            value = process.env[key] || this._fileSettings[key];
        }
        return (value ? new cm.Maybe(value) : new cm.Maybe());
    }
    /**
     * @see IConfigurationProvider.fetch
     */
    async fetch() {
        const addresses = Array.from(this._addresses), oldSettings = this._remoteSettings;
        // Manual loop with "JS label"
        tryFetch: {
            const addr = addresses.shift();
            if (addr) {
                if (await this.attemptFetch(addr)) {
                    // Move this address onto top of list
                    const pos = addresses.indexOf(addr);
                    if (pos != 0) {
                        addresses.splice(pos, 1);
                        addresses.unshift(addr);
                    }
                    this.broadCastChanges(oldSettings, this._remoteSettings);
                    if (this._refetchTimer === undefined) {
                        this.updateSelf();
                        this.repeatFetch();
                    }
                    // Stop trying if success
                    return true;
                }
                break tryFetch;
            }
        }
        // Don't throw error on refetching
        if (this._refetchTimer === undefined) {
            throw new cm.CriticalException('Cannot connect to any address of Configuration Service!');
        }
        return false;
    }
    onUpdate(listener) {
        this._eventEmitter.on('updated', listener);
    }
    applySettings() {
        this.refetchInterval = this.get(S.SETTINGS_REFETCH_INTERVAL).TryGetValue(5 * 60000); // Default 5 mins
        try {
            const addresses = JSON.parse(this.get(S.SETTINGS_SERVICE_ADDRESSES).value);
            return (addresses && addresses.length) ? new cm.Maybe(addresses) : new cm.Maybe;
        }
        catch (err) {
            return new cm.Maybe;
        }
    }
    updateSelf() {
        this._eventEmitter.prependListener('updated', (changedKeys) => {
            if (changedKeys.includes(S.SETTINGS_REFETCH_INTERVAL) || changedKeys.includes(S.SETTINGS_SERVICE_ADDRESSES)) {
                const addresses = this.applySettings();
                if (addresses.hasValue) {
                    this._addresses = addresses.value;
                }
                else {
                    console.warn('New SettingService addresses are useless!');
                }
            }
        });
    }
    repeatFetch() {
        this._refetchTimer = setInterval(() => this.fetch(), this.refetchInterval);
    }
    stopRefetch() {
        clearInterval(this._refetchTimer);
        this._refetchTimer = null;
    }
    async attemptFetch(address) {
        try {
            const serviceName = this.get(S.SERVICE_SLUG), ipAddress = '0.0.0.0'; // If this service runs inside a Docker container,
            // this should be the host's IP address.
            this._rpcCaller.baseAddress = address;
            const req = cm.GetSettingRequest.translator.whole({
                slug: serviceName.value,
                ipAddress,
            });
            const res = await this._rpcCaller.call(M.PROGRAM_CONFIGURATION, A.GET_SETTINGS, req);
            if (res.isSuccess) {
                this._remoteSettings = this.parseSettings(res.payload);
                return true;
            }
        }
        catch (err) {
            console.warn(err);
        }
        return false;
    }
    broadCastChanges(oldSettings, newSettings) {
        if (!newSettings) {
            return;
        }
        const oldKeys = Object.getOwnPropertyNames(oldSettings);
        const newKeys = Object.getOwnPropertyNames(newSettings);
        const changedKeys = [];
        let val;
        // Update existing values or add new keys
        for (const key of newKeys) {
            val = newSettings[key];
            if (val !== oldSettings[key]) {
                changedKeys.push(key);
            }
        }
        // Reset abandoned keys.
        for (const key of oldKeys) {
            if (!newKeys.includes(key)) {
                changedKeys.push(key);
            }
        }
        if (changedKeys.length) {
            this._eventEmitter.emit('updated', changedKeys);
        }
    }
    parseSettings(raw) {
        if (!raw) {
            return {};
        }
        const map = {}, settings = cm.SettingItem.translator.whole(raw);
        for (const st of settings) {
            map[st.name] = this.parseValue(st.value, st.dataType);
        }
        return map;
    }
    parseValue(val, type) {
        if (val === undefined) {
            return null;
        }
        if (type == cm.SettingItemDataType.String) {
            return val;
        }
        else {
            return JSON.parse(val);
        }
    }
};
__decorate([
    cm.lazyInject('service-communication.IDirectRpcCaller'),
    __metadata("design:type", Object)
], ConfigurationProvider.prototype, "_rpcCaller", void 0);
ConfigurationProvider = __decorate([
    cm.injectable(),
    __metadata("design:paramtypes", [])
], ConfigurationProvider);
exports.ConfigurationProvider = ConfigurationProvider;
//# sourceMappingURL=ConfigurationProvider.js.map