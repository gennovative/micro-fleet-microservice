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
const rpc = require("./RpcCommon");
let MessageBrokerRpcHandler = class MessageBrokerRpcHandler extends rpc.RpcHandlerBase {
    constructor(depContainer, _msgBrokerAdt) {
        super(depContainer);
        this._msgBrokerAdt = _msgBrokerAdt;
    }
    handle(action, dependencyIdentifier, actionFactory) {
        Guard_1.Guard.assertDefined('action', action);
        Guard_1.Guard.assertDefined('dependencyIdentifier', dependencyIdentifier);
        let actionFn = this.resolveActionFunc(action, dependencyIdentifier, actionFactory);
        this._msgBrokerAdt.subscribe(`request.${this._name}.${action}`, this.buildHandleFunc(actionFn));
    }
    buildHandleFunc(actionFn) {
        return (msg, ack, nack) => {
            let request = msg.data, replyTopic = msg.properties.replyTopic, correlationId = msg.properties.correlationId;
            (new Promise((resolve, reject) => {
                // Execute controller's action
                actionFn(request, resolve, reject);
            }))
                .then(result => {
                // Sends response to reply topic
                return this._msgBrokerAdt.publish(replyTopic, this.createResponse(true, result, request.from), { correlationId });
            })
                .then(ack) // Only ack when the response has been sent, which means message broker can remove this message from queue.
                .catch(error => {
                // If error is an uncaught Exception object, that means the action method
                // has a problem. We should nack to tell message broker to send this message to someone else.
                if (error instanceof ex.Exception) {
                    // TODO: Should log this unexpected error.
                    nack();
                }
                // If this is a custom error, which means the action method sends this error
                // back to caller on purpose.
                return this._msgBrokerAdt.publish(replyTopic, this.createResponse(false, error, request.from), { correlationId });
            });
        };
    }
};
MessageBrokerRpcHandler = __decorate([
    DependencyContainer_1.injectable(),
    __param(0, DependencyContainer_1.inject(Types_1.Types.DEPENDENCY_CONTAINER)),
    __param(1, DependencyContainer_1.inject(Types_1.Types.BROKER_ADAPTER)),
    __metadata("design:paramtypes", [Object, Object])
], MessageBrokerRpcHandler);
exports.MessageBrokerRpcHandler = MessageBrokerRpcHandler;

//# sourceMappingURL=MessageBrokerRpcHandler.js.map
