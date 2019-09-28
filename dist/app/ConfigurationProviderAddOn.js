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
const path = require("path");
const events_1 = require("events");
const cm = require("@micro-fleet/common");
const Module_1 = require("./constants/Module");
const Action_1 = require("./constants/Action");
const { decorators: d, constants: { Service: S, }, } = cm;
/**
 * Provides settings from appconfig.json, environmental variables and remote settings service.
 */
let ConfigurationProviderAddOn = class ConfigurationProviderAddOn {
    constructor() {
        this.name = 'ConfigurationProvider';
        this.configFilePath = path.resolve(process.cwd(), './dist/app/configs');
        this._remoteSettings = this._fileSettings = {};
        this.enableRemote = false;
        this._eventEmitter = new events_1.EventEmitter();
        this._isInit = false;
    }
    //#region Getters & Setters
    get refetchInterval() {
        return this._refetchInterval;
    }
    set refetchInterval(val) {
        this._refetchInterval = val;
        if (this._refetchTimer) {
            this._stopRefetch();
            this._repeatFetch();
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
            this._fileSettings = require(this.configFilePath);
        }
        catch (ex) {
            // TODO: Should use logger
            // console.warn(ex);
            this._fileSettings = {};
        }
        if (this.enableRemote) {
            this._applySettings().mapElse(() => {
                throw new cm.CriticalException('No address for Settings Service!');
            });
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
        this._stopRefetch();
        this.configFilePath = null;
        this._fileSettings = null;
        this._remoteSettings = null;
        this.enableRemote = null;
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
        if (value == null) {
            value = Boolean(dataType)
                ? this._parseValue(this._getEnvOrFile(key), dataType)
                : this._getEnvOrFile(key);
        }
        return (value != null ? cm.Maybe.Just(value, key) : cm.Maybe.Nothing(key));
    }
    _getEnvOrFile(key) {
        if (process.env[key] != null) {
            return process.env[key];
        }
        return this._fileSettings[key];
    }
    /**
     * @see IConfigurationProvider.fetch
     */
    async fetch() {
        if (!this.enableRemote) {
            return false;
        }
        const allAddr = this._addresses, addrToTry = [...allAddr], oldSettings = this._remoteSettings;
        // Manual loop with "JS label"
        tryFetch: {
            const addr = addrToTry.shift();
            if (addr) {
                this._remoteSettings = await this._attemptFetch(addr);
                if (this._remoteSettings) {
                    // Move this address onto top of list
                    const pos = allAddr.indexOf(addr);
                    if (pos != 0) {
                        allAddr.splice(pos, 1);
                        allAddr.unshift(addr);
                    }
                    this._broadCastChanges(oldSettings, this._remoteSettings);
                    if (this._refetchTimer === undefined) {
                        this._updateSelf();
                        this._repeatFetch();
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
    _applySettings() {
        this.refetchInterval = this.get(S.CONFIG_REFETCH_INTERVAL).tryGetValue(5 * 60000); // Default 5 mins
        try {
            const addresses = JSON.parse(this.get(S.CONFIG_SERVICE_ADDRESSES).value);
            if (addresses && addresses.length) {
                this._addresses = addresses;
                return cm.Maybe.Just(addresses);
            }
        }
        catch (err) {
            console.warn(err);
        }
        return cm.Maybe.Nothing();
    }
    _updateSelf() {
        this._eventEmitter.prependListener('updated', (changedKeys) => {
            if (changedKeys.includes(S.CONFIG_REFETCH_INTERVAL) || changedKeys.includes(S.CONFIG_SERVICE_ADDRESSES)) {
                this._applySettings().mapElse(() => {
                    console.warn('New SettingService addresses are useless!');
                });
            }
        });
    }
    _repeatFetch() {
        this._refetchTimer = setInterval(() => this.fetch(), this.refetchInterval);
    }
    _stopRefetch() {
        clearInterval(this._refetchTimer);
        this._refetchTimer = null;
    }
    async _attemptFetch(address) {
        try {
            const serviceName = this.get(S.SERVICE_SLUG), ipAddress = '0.0.0.0'; // If this service runs inside a Docker container,
            // this should be the host's IP address.
            const req = cm.GetSettingRequest.from({
                slug: serviceName.value,
                ipAddress,
            });
            const res = await this._rpcCaller.call({
                moduleName: Module_1.Module.CONFIG_CONTROL,
                actionName: Action_1.Action.GET_SETTINGS,
                params: req,
            });
            if (res.isSuccess) {
                return this._parseSettings(res.payload);
            }
        }
        catch (err) {
            console.warn(err);
        }
        return null;
    }
    _broadCastChanges(oldSettings, newSettings) {
        if (!newSettings) {
            return;
        }
        const oldKeys = Object.getOwnPropertyNames(oldSettings);
        const newKeys = Object.getOwnPropertyNames(newSettings);
        const changedKeys = [];
        // Update existing values or add new keys
        for (const key of newKeys) {
            if (newSettings[key] !== oldSettings[key]) {
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
    _parseSettings(raw) {
        if (!raw) {
            return {};
        }
        const map = {}, settings = cm.SettingItem.fromMany(raw);
        for (const st of settings) {
            map[st.name] = this._parseValue(st.value, st.dataType);
        }
        return map;
    }
    _parseValue(val, type) {
        if (val === undefined) {
            return null;
        }
        if (type == cm.SettingItemDataType.String) {
            return val;
        }
        return JSON.parse(val);
    }
};
__decorate([
    d.lazyInject('service-communication.IDirectRpcCaller'),
    __metadata("design:type", Object)
], ConfigurationProviderAddOn.prototype, "_rpcCaller", void 0);
ConfigurationProviderAddOn = __decorate([
    d.injectable(),
    __metadata("design:paramtypes", [])
], ConfigurationProviderAddOn);
exports.ConfigurationProviderAddOn = ConfigurationProviderAddOn;
//# sourceMappingURL=ConfigurationProviderAddOn.js.map