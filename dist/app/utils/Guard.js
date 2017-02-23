"use strict";
const _ = require("lodash");
const Exceptions_1 = require("../microservice/Exceptions");
class Guard {
    constructor() { }
    static assertDefined(name, target) {
        if (target === null || target === undefined) {
            throw new Exceptions_1.InvalidArgumentException(name, 'Must not be null or undefined!');
        }
    }
    static assertNotEmpty(name, target) {
        if (_.isEmpty(target)) {
            throw new Exceptions_1.InvalidArgumentException(name, 'Must not be null, undefined or empty!');
        }
    }
    static assertIsFunction(name, target) {
        if (!_.isFunction(target)) {
            throw new Exceptions_1.InvalidArgumentException(name, 'Must not be null, undefined or empty!');
        }
    }
}
exports.Guard = Guard;

//# sourceMappingURL=Guard.js.map
