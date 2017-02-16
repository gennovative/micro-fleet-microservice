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
const DependencyContainer_1 = require("../utils/DependencyContainer");
const Types_1 = require("../constants/Types");
let MessageBrokerAdapter = class MessageBrokerAdapter {
    constructor(_configAdapter) {
        this._configAdapter = _configAdapter;
    }
    init() {
        let cfgAdt = this._configAdapter;
        return Promise.resolve(true);
    }
};
MessageBrokerAdapter = __decorate([
    DependencyContainer_1.injectable(),
    __param(0, DependencyContainer_1.inject(Types_1.Types.CONFIG_ADAPTER)),
    __metadata("design:paramtypes", [Object])
], MessageBrokerAdapter);
exports.MessageBrokerAdapter = MessageBrokerAdapter;

//# sourceMappingURL=MessageBrokerAdapter.js.map
