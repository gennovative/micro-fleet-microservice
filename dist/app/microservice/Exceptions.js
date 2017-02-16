"use strict";
class Exception {
    constructor(_message, _isCritical) {
        this._message = _message;
        this._isCritical = _isCritical;
    }
    get name() {
        return this._stack;
    }
    set name(value) {
        this._stack = value;
    }
    get stack() {
        return this._stack;
    }
    set stack(value) {
        this._stack = value;
    }
    get message() {
        return this._message;
    }
    get isCritical() {
        return this._isCritical;
    }
    toString() {
        return `[${(this._isCritical ? 'Critical' : 'Minor')}] ${this._message ? this._message : 'An error has occured!'}`;
    }
}
exports.Exception = Exception;
class CriticalException extends Exception {
    constructor(message) {
        super(message, false);
    }
}
exports.CriticalException = CriticalException;
class MinorException extends Exception {
    constructor(message) {
        super(message, false);
    }
}
exports.MinorException = MinorException;
class InvalidArgumentException extends Exception {
    constructor(argName, message) {
        super(`The argument "${argName}" is invalid!${(message ? message : '')}`, true);
    }
}
exports.InvalidArgumentException = InvalidArgumentException;

//# sourceMappingURL=Exceptions.js.map
