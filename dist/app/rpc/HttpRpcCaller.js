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
const request = require("request-promise");
const Guard_1 = require("../utils/Guard");
const DependencyContainer_1 = require("../utils/DependencyContainer");
const RpcCallerBase_1 = require("./RpcCallerBase");
let HttpRpcCaller = class HttpRpcCaller extends RpcCallerBase_1.RpcCallerBase {
    constructor() {
        super();
        this._requestMaker = request;
    }
    get baseUrl() {
        return this._baseUrl;
    }
    set baseUrl(val) {
        this._baseUrl = val;
    }
    call(moduleName, action, param) {
        Guard_1.Guard.assertDefined('moduleName', moduleName);
        Guard_1.Guard.assertDefined('action', action);
        Guard_1.Guard.assertIsTruthy(this._baseUrl, 'Base URL must be set!');
        return new Promise((resolve, reject) => {
            let options = {
                method: 'POST',
                uri: `${this._baseUrl}/${moduleName}/${action}`,
                body: param,
                json: true // Automatically stringifies the body to JSON
            };
            return this._requestMaker(options);
        });
    }
};
HttpRpcCaller = __decorate([
    DependencyContainer_1.injectable(),
    __metadata("design:paramtypes", [])
], HttpRpcCaller);
exports.HttpRpcCaller = HttpRpcCaller;

//# sourceMappingURL=HttpRpcCaller.js.map
