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
const ex = require("../microservice/Exceptions");
const Guard_1 = require("../utils/Guard");
const Types_1 = require("../constants/Types");
const DependencyContainer_1 = require("../utils/DependencyContainer");
const RpcHandlerBase_1 = require("./RpcHandlerBase");
let ExpressRpcHandler = class ExpressRpcHandler extends RpcHandlerBase_1.RpcHandlerBase {
    constructor(depContainer) {
        super(depContainer);
        this._urlSafe = /^[a-zA-Z0-9_-]*$/.compile();
    }
    get router() {
        return this._router;
    }
    set router(val) {
        this._router = val;
    }
    handle(action, dependencyIdentifier, actionFactory) {
        Guard_1.Guard.assertIsMatch(null, this._urlSafe, action, `Route "${action}" is not URL-safe!`);
        Guard_1.Guard.assertIsTruthy(this._router, 'Router must be set!');
        let actionFn = this.resolveActionFunc(action, dependencyIdentifier, actionFactory);
        this._router.post(`/${action}`, this.buildHandleFunc(actionFn));
    }
    buildHandleFunc(actionFn) {
        return (req, res) => {
            let request = {
                from: req.body.from,
                to: req.body.to,
                param: req.body
            };
            (new Promise((resolve, reject) => {
                // Execute controller's action
                actionFn(request, resolve, reject);
            }))
                .then(result => {
                res.send(200, this.createResponse(true, result, request.from));
            })
                .catch(error => {
                let errMsg = error, statusCode = 200;
                // If error is an uncaught Exception object, that means the action method
                // has a problem. We should response with error status code.
                if (error instanceof ex.Exception) {
                    // TODO: Should log this unexpected error.
                    statusCode = 500;
                    errMsg = error.message;
                }
                // If this is a custom error, which means the action method sends this error
                // back to caller on purpose.
                res.send(statusCode, this.createResponse(false, errMsg, request.from));
            });
        };
    }
};
ExpressRpcHandler = __decorate([
    DependencyContainer_1.injectable(),
    __param(0, DependencyContainer_1.inject(Types_1.Types.DEPENDENCY_CONTAINER)),
    __metadata("design:paramtypes", [Object])
], ExpressRpcHandler);
exports.ExpressRpcHandler = ExpressRpcHandler;

//# sourceMappingURL=HttpRpcHandler.js.map
