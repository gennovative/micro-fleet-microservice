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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const request = require("request-promise");
const DependencyContainer_1 = require("../utils/DependencyContainer");
const SettingKeys_1 = require("../constants/SettingKeys");
let ConfigurationAdapter = class ConfigurationAdapter {
    constructor() {
        this._configFilePath = `${process.cwd()}/appconfig.json`;
        this._remoteSettings = {};
        this._requestMaker = request;
        this._enableRemote = false;
    }
    get enableRemote() {
        return this._enableRemote;
    }
    set enableRemote(value) {
        this._enableRemote = value;
    }
    init() {
        try {
            this._fileSettings = require(this._configFilePath);
        }
        catch (ex) {
            this._fileSettings = {};
        }
        return Promise.resolve(true);
    }
    get(key) {
        let value = (this._remoteSettings[key] || process.env[key] || this._fileSettings[key]);
        return (value ? value : null);
    }
    fetch() {
        return __awaiter(this, void 0, void 0, function* () {
            let addressRaw = this.get(SettingKeys_1.SettingKeys.CONFIG_SERVICE_ADDRESSES);
            if (!addressRaw || !addressRaw.length) {
                throw 'No address for Configuration Service!';
            }
            let addressList = addressRaw.split(';'), i = 0;
            for (; i < addressList.length; i++) {
                if (yield this.attemptFetch(addressList[i])) {
                    return true;
                }
            }
            throw 'Cannot connect to any address of Configuration Service!';
        });
    }
    attemptFetch(address) {
        return __awaiter(this, void 0, void 0, function* () {
            let serviceName = this.get(SettingKeys_1.SettingKeys.SERVICE_NAME), options = {
                uri: address,
                qs: {
                    name: serviceName
                },
                json: true
            };
            try {
                let json = yield this._requestMaker(options);
                if (json.success) {
                    this._remoteSettings = json.settings;
                    return true;
                }
            }
            catch (err) {
            }
            return false;
        });
    }
};
ConfigurationAdapter = __decorate([
    DependencyContainer_1.injectable(),
    __metadata("design:paramtypes", [])
], ConfigurationAdapter);
exports.ConfigurationAdapter = ConfigurationAdapter;

//# sourceMappingURL=ConfigurationAdapter.js.map
