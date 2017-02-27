"use strict";
const Guard_1 = require("../utils/Guard");
class RpcHandlerBase {
    constructor(_depContainer) {
        this._depContainer = _depContainer;
    }
    get name() {
        return this._name;
    }
    set name(val) {
        this._name = val;
    }
    resolveActionFunc(action, depId, actFactory) {
        // Attempt to resolve controller instance
        let instance = this._depContainer.resolve(depId);
        Guard_1.Guard.assertIsTruthy(instance, `Cannot resolve dependency ${depId}!`);
        let actionFn = (action ? instance[action] : null);
        // If default action is not available, attempt to get action from factory.
        if (!actionFn) {
            actionFn = (actFactory ? actFactory(instance) : null);
        }
        Guard_1.Guard.assertIsTruthy(instance, `Specified action does not exist!`);
        return actionFn.bind(instance);
    }
    createResponse(isSuccess, data, replyTo) {
        return {
            isSuccess,
            from: this._name,
            to: replyTo,
            data
        };
    }
}
exports.RpcHandlerBase = RpcHandlerBase;

//# sourceMappingURL=RpcHandlerBase.js.map
