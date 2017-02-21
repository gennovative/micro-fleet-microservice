"use strict";
const Exceptions_1 = require("../microservice/Exceptions");
class Guard {
    constructor() { }
    static assertDefined(name, target) {
        if (target === null || target === undefined) {
            throw new Exceptions_1.InvalidArgumentException(name, 'Must not be null or undefined!');
        }
    }
}
exports.Guard = Guard;

//# sourceMappingURL=Guard.js.map
