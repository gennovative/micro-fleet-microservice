"use strict";
const inversify_1 = require("inversify");
exports.injectable = inversify_1.injectable;
exports.inject = inversify_1.inject;
const Guard_1 = require("./Guard");
class BindingScope {
    constructor(_binding) {
        this._binding = _binding;
    }
    asSingleton() {
        this._binding.inSingletonScope();
    }
    asTransient() {
        this._binding.inTransientScope();
    }
}
exports.BindingScope = BindingScope;
class DependencyContainer {
    constructor() {
        this._container = new inversify_1.Container();
    }
    bind(identifier, constructor) {
        this.assertNotDisposed();
        Guard_1.Guard.assertDefined('constructor', constructor);
        let container = this._container, binding, scope;
        if (container.isBound(identifier)) {
            container.unbind(identifier);
        }
        binding = this._container.bind(identifier).to(constructor);
        scope = new BindingScope(binding);
        return scope;
    }
    resolve(identifier) {
        this.assertNotDisposed();
        try {
            return this._container.get(identifier);
        }
        catch (ex) {
            console.log('Resolve Error: ' + ex);
            return null;
        }
    }
    dispose() {
        this._container.unbindAll();
        this._container = null;
    }
    assertNotDisposed() {
        if (!this._container) {
            throw 'Container has been disposed!';
        }
    }
}
exports.DependencyContainer = DependencyContainer;

//# sourceMappingURL=DependencyContainer.js.map
