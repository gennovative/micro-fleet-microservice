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
Object.defineProperty(exports, "__esModule", { value: true });
const back_lib_common_util_1 = require("back-lib-common-util");
const back_lib_service_communication_1 = require("back-lib-service-communication");
const SettingKeys_1 = require("../constants/SettingKeys");
const Types_1 = require("../constants/Types");
let MessageBrokerAddOn = class MessageBrokerAddOn {
    constructor(_configProvider, _msgBrokerCnn) {
        this._configProvider = _configProvider;
        this._msgBrokerCnn = _msgBrokerCnn;
    }
    init() {
        let cfgAdt = this._configProvider, opts = {
            hostAddress: cfgAdt.get(SettingKeys_1.SettingKeys.MSG_BROKER_HOST),
            username: cfgAdt.get(SettingKeys_1.SettingKeys.MSG_BROKER_USERNAME),
            password: cfgAdt.get(SettingKeys_1.SettingKeys.MSG_BROKER_PASSWORD),
            exchange: cfgAdt.get(SettingKeys_1.SettingKeys.MSG_BROKER_EXCHANGE),
            queue: cfgAdt.get(SettingKeys_1.SettingKeys.MSG_BROKER_QUEUE)
        };
        return this._msgBrokerCnn.connect(opts);
    }
    dispose() {
        return this._msgBrokerCnn.disconnect();
    }
};
MessageBrokerAddOn = __decorate([
    back_lib_common_util_1.injectable(),
    __param(0, back_lib_common_util_1.inject(Types_1.Types.CONFIG_PROVIDER)),
    __param(1, back_lib_common_util_1.inject(back_lib_service_communication_1.Types.MSG_BROKER_CONNECTOR)),
    __metadata("design:paramtypes", [Object, Object])
], MessageBrokerAddOn);
exports.MessageBrokerAddOn = MessageBrokerAddOn;

//# sourceMappingURL=MessageBrokerAddOn.js.map
