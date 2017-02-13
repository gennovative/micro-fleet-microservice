"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const request_promise_1 = require("request-promise");
const SettingKeys = require('../constants/SettingKeys');
class ConfigurationAdapter {
    constructor(requestMaker) {
        this._configFilePath = `${process.cwd()}/appconfig.json`;
        this._staticSettings = require(this._configFilePath);
        this._requestMaker = requestMaker || request_promise_1.default;
        this._settings = {};
    }
    get(key) {
        return this._settings[key] || process.env[key] || this._staticSettings[key];
    }
    fetch() {
        return __awaiter(this, void 0, void 0, function* () {
            let addressRaw = this.get(SettingKeys.CONFIG_SERVICE_ADDRESSES);
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
            let serviceName = this.get(SettingKeys.SERVICE_NAME), options = {
                uri: address,
                qs: {
                    name: serviceName
                },
                json: true
            };
            try {
                let json = yield this._requestMaker(options);
                if (json.success) {
                    this._settings = json.settings;
                }
                return true;
            }
            catch (err) {
                return false;
            }
        });
    }
}
exports.ConfigurationAdapter = ConfigurationAdapter;

//# sourceMappingURL=ConfigurationAdapter.js.map
