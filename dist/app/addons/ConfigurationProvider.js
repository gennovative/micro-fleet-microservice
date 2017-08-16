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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const back_lib_common_contracts_1 = require("back-lib-common-contracts");
const back_lib_common_util_1 = require("back-lib-common-util");
const back_lib_service_communication_1 = require("back-lib-service-communication");
const SettingKeys_1 = require("../constants/SettingKeys");
/**
 * Provides settings from appconfig.json, environmental variables and remote settings service.
 */
let ConfigurationProvider = class ConfigurationProvider {
    constructor(_rpcCaller) {
        this._rpcCaller = _rpcCaller;
        this._configFilePath = `${process.cwd()}/appconfig.json`;
        back_lib_common_util_1.Guard.assertArgDefined('_rpcCaller', _rpcCaller);
        this._remoteSettings = {};
        this._enableRemote = false;
        this._rpcCaller.name = 'ConfigurationProvider';
    }
    get enableRemote() {
        return this._enableRemote;
    }
    set enableRemote(value) {
        this._enableRemote = value;
    }
    init() {
        return new Promise(resolve => {
            try {
                this._fileSettings = require(this._configFilePath);
            }
            catch (ex) {
                this._fileSettings = {};
            }
            resolve();
        });
    }
    dispose() {
        return new Promise(resolve => {
            this._configFilePath = null;
            this._fileSettings = null;
            this._remoteSettings = null;
            this._enableRemote = null;
            this._rpcCaller = null;
            resolve();
        });
    }
    /**
     * Attempts to get settings from cached Configuration Service, environmetal variable,
     * and `appconfig.json` file, respectedly.
     */
    get(key) {
        let value = (this._remoteSettings[key] || process.env[key] || this._fileSettings[key]);
        return (value ? value : null);
    }
    /**
     * Attempts to fetch settings from remote Configuration Service.
     */
    fetch() {
        return __awaiter(this, void 0, void 0, function* () {
            let addresses = JSON.parse(this.get(SettingKeys_1.SettingKeys.SETTINGS_SERVICE_ADDRESSES));
            if (!addresses || !addresses.length) {
                throw new back_lib_common_util_1.CriticalException('No address for Configuration Service!');
            }
            for (let addr of addresses) {
                if (yield this.attemptFetch(addr)) {
                    // Stop trying if success
                    return true;
                }
            }
            throw new back_lib_common_util_1.CriticalException('Cannot connect to any address of Configuration Service!');
        });
    }
    attemptFetch(address) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let serviceName = this.get(SettingKeys_1.SettingKeys.SERVICE_SLUG), ipAddress = ''; // If this service runs inside a Docker container, 
                // this should be the host's IP address.
                this._rpcCaller.baseAddress = address;
                let req = new back_lib_common_contracts_1.GetSettingRequest();
                req.slug = serviceName;
                req.ipAddress = ipAddress;
                let res = yield this._rpcCaller.call('SettingService', 'getSetting', req);
                if (res.isSuccess) {
                    this._remoteSettings = this.parseSettings(res.data);
                    return true;
                }
            }
            catch (err) {
                console.warn(err);
            }
            return false;
        });
    }
    parseSettings(raw) {
        let map = {}, settings = back_lib_common_contracts_1.SettingItem.translator.whole(raw);
        for (let st of settings) {
            map[st.name] = this.parseValue(st.value, st.dataType);
        }
        return map;
    }
    parseValue(val, type) {
        if (type == back_lib_common_contracts_1.SettingItemDataType.Number) {
            return parseFloat(val);
        }
        else if (type == back_lib_common_contracts_1.SettingItemDataType.Boolean) {
            // val = 'true' | 'false'; (lowercase)
            return JSON.parse(val);
        }
        return val; // string data type
    }
};
ConfigurationProvider = __decorate([
    back_lib_common_util_1.injectable(),
    __param(0, back_lib_common_util_1.inject(back_lib_service_communication_1.Types.DIRECT_RPC_CALLER)),
    __metadata("design:paramtypes", [Object])
], ConfigurationProvider);
exports.ConfigurationProvider = ConfigurationProvider;

//# sourceMappingURL=ConfigurationProvider.js.map
