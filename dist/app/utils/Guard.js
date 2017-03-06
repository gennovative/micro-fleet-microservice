"use strict";
const _ = require("lodash");
const ex = require("../microservice/Exceptions");
class Guard {
    constructor() { }
    static assertDefined(name, target, message) {
        if (target === null || target === undefined) {
            throw new ex.InvalidArgumentException(name, message || 'Must not be null or undefined!');
        }
    }
    static assertNotEmpty(name, target, message) {
        if (_.isEmpty(target)) {
            throw new ex.InvalidArgumentException(name, message || 'Must not be null, undefined or empty!');
        }
    }
    static assertIsFunction(name, target, message) {
        if (!_.isFunction(target)) {
            throw new ex.InvalidArgumentException(name, message || 'Must not be null, undefined or empty!');
        }
    }
    static assertIsTruthy(target, message, isCritical = true) {
        if (!target) {
            if (isCritical) {
                throw new ex.CriticalException(message);
            }
            else {
                throw new ex.MinorException(message);
            }
        }
    }
    static assertIsFalsey(target, message, isCritical = true) {
        Guard.assertIsTruthy(!target, message, isCritical);
    }
    static assertIsMatch(name, rule, target, message) {
        if (!rule.test(target)) {
            throw new ex.InvalidArgumentException(name, message || 'Does not match specified rule!');
        }
    }
}
exports.Guard = Guard;

//# sourceMappingURL=Guard.js.map
