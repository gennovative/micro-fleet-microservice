"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const ConfigurationAdapter_1 = require("../adapters/ConfigurationAdapter");
const DatabaseAdapter_1 = require("../adapters/DatabaseAdapter");
const DependencyContainer_1 = require("../utils/DependencyContainer");
const Types_1 = require("../constants/Types");
class MicroServiceBase {
    constructor() {
        this._adapters = [];
    }
    start() {
        this.registerDependencies();
        this.addConfigAdapter();
        this.onStarting(this);
        this.initAdapters()
            .then(() => {
            this.onStarted(this);
        })
            .catch(err => {
            console.error(err);
        });
    }
    stop() {
        this.onStopping(this);
        this.onStopped(this);
    }
    addDbAdapter() {
        let dbAdt = this._depContainer.resolve(Types_1.Types.DB_ADAPTER);
        this.addAdapter(dbAdt);
    }
    onStarting(thisService) {
    }
    onStarted(thisService) {
    }
    onStopping(thisService) {
    }
    onStopped(thisService) {
    }
    addAdapter(adapter) {
        this._adapters.push(adapter);
    }
    addConfigAdapter() {
        this._configAdapter = this._depContainer.resolve(Types_1.Types.CONFIG_ADAPTER);
        this.addAdapter(this._configAdapter);
    }
    registerDependencies() {
        this._depContainer = new DependencyContainer_1.DependencyContainer();
        this._depContainer.bind(Types_1.Types.CONFIG_ADAPTER, ConfigurationAdapter_1.ConfigurationAdapter);
        this._depContainer.bind(Types_1.Types.DB_ADAPTER, DatabaseAdapter_1.KnexDatabaseAdapter);
    }
    initAdapters() {
        return __awaiter(this, void 0, void 0, function* () {
            let cfgAdt = this._configAdapter, initPromises;
            yield cfgAdt.init();
            if (!cfgAdt.enableRemote || (yield cfgAdt.fetch())) {
                initPromises = this._adapters.map(adt => adt.init);
            }
            else {
                throw 'Fail to fetch configuration!';
            }
            yield Promise.all(initPromises);
        });
    }
}
exports.MicroServiceBase = MicroServiceBase;

//# sourceMappingURL=MicroServiceBase.js.map
