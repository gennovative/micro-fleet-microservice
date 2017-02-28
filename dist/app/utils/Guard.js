"use strict";
const _ = require("lodash");
const ex = require("../microservice/Exceptions");
class Guard {
    constructor() { }
    static assertDefined(name, target) {
        if (target === null || target === undefined) {
            throw new ex.InvalidArgumentException(name, 'Must not be null or undefined!');
        }
    }
    static assertNotEmpty(name, target) {
        if (_.isEmpty(target)) {
            throw new ex.InvalidArgumentException(name, 'Must not be null, undefined or empty!');
        }
    }
    static assertIsFunction(name, target) {
        if (!_.isFunction(target)) {
            throw new ex.InvalidArgumentException(name, 'Must not be null, undefined or empty!');
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
