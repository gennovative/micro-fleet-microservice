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
const MessageBrokerAdapter_1 = require("../adapters/MessageBrokerAdapter");
const DependencyContainer_1 = require("../utils/DependencyContainer");
const Exceptions_1 = require("./Exceptions");
const Types_1 = require("../constants/Types");
class MicroServiceBase {
    constructor() {
        this._adapters = [];
        this._isStarted = false;
    }
    get isStarted() {
        return this._isStarted;
    }
    /**
     * Bootstraps this service application.
     */
    start() {
        this.registerDependencies();
        //this.addModelMapper();
        this.addConfigAdapter();
        try {
            // A chance for derived class to add more adapters or do some customizations.
            this.onStarting();
        }
        catch (ex) {
            this.onError(ex);
            console.error('An error occured on starting, the application has to stop now.');
            this.stop();
            return;
        }
        this.initAdapters()
            .then(() => {
            this._isStarted = true;
            this.handleGracefulShutdown();
            this.onStarted();
        })
            .catch(err => {
            this.onError(err);
        });
    }
    /**
     * Gracefully stops this application and exit
     */
    stop(exitProcess = true) {
        (() => __awaiter(this, void 0, void 0, function* () {
            try {
                this.onStopping();
                this._depContainer.dispose();
                yield this.disposeAdapters();
                this._isStarted = false;
                this.onStopped();
            }
            catch (ex) {
                this.onError(ex);
            }
            finally {
                exitProcess &&
                    /* istanbul ignore next: only useful on production */
                    this.exitProcess();
            }
        }))();
    }
    /**
     * @return Total number of adapters that have been added so far.
     */
    addAdapter(adapter) {
        return this._adapters.push(adapter);
    }
    // TODO: Should ha addAdapterFromContainer
    addDbAdapter() {
        let dbAdt = this._depContainer.resolve(Types_1.Types.DB_ADAPTER);
        this.addAdapter(dbAdt);
        return dbAdt;
    }
    addConfigAdapter() {
        let cfgAdt = this._configAdapter = this._depContainer.resolve(Types_1.Types.CONFIG_ADAPTER);
        this.addAdapter(cfgAdt);
        return cfgAdt;
    }
    addMessageBrokerAdapter() {
        let dbAdt = this._depContainer.resolve(Types_1.Types.BROKER_ADAPTER);
        this.addAdapter(dbAdt);
        return dbAdt;
    }
    registerDbAdapter() {
        this._depContainer.bind(Types_1.Types.DB_ADAPTER, DatabaseAdapter_1.KnexDatabaseAdapter).asSingleton();
    }
    registerConfigAdapter() {
        this._depContainer.bind(Types_1.Types.CONFIG_ADAPTER, ConfigurationAdapter_1.ConfigurationAdapter).asSingleton();
    }
    registerMessageBrokerAdapter() {
        this._depContainer.bind(Types_1.Types.BROKER_ADAPTER, MessageBrokerAdapter_1.TopicMessageBrokerAdapter).asSingleton();
    }
    registerModelMapper() {
        this._depContainer.bindConstant(Types_1.Types.MODEL_MAPPER, automapper);
        return automapper;
    }
    registerDependencies() {
        let depCon = this._depContainer = new DependencyContainer_1.DependencyContainer();
        depCon.bindConstant(Types_1.Types.DEPENDENCY_CONTAINER, depCon);
        this.registerConfigAdapter();
    }
    /**
     * Invoked whenever any error occurs in the application.
     */
    onError(error) {
        /* istanbul ignore next */
        let msg = (error.toString ? error.toString() : error + '');
        console.error(msg); // Should log to file.
    }
    /**
     * Invoked after registering dependencies, but before all other initializations.
     */
    onStarting() {
    }
    /**
     * Invoked after all initializations. At this stage, the application is considered
     * started successfully.
     */
    onStarted() {
    }
    /**
     * Invoked when `stop` method is called, before any other actions take place.
     */
    onStopping() {
    }
    /**
     * Invoked after all finalizations have finished. At this stage, the application is
     * considered stopped successfully. The process will be killed after this.
     */
    onStopped() {
    }
    initAdapters() {
        return __awaiter(this, void 0, void 0, function* () {
            let cfgAdt = this._configAdapter, initPromises;
            // Config adapter must be initialized first, because all other adapters
            // depend on it.
            yield cfgAdt.init();
            // If remote config is disabled or
            // if remote config is enanbed and fetching successfully.
            if (!cfgAdt.enableRemote || (yield cfgAdt.fetch())) {
                initPromises = this._adapters.map(adt => adt.init());
            }
            else {
                throw new Exceptions_1.CriticalException('Fail to fetch configuration!');
            }
            yield Promise.all(initPromises);
        });
    }
    disposeAdapters() {
        return __awaiter(this, void 0, void 0, function* () {
            let disposePromises = this._adapters.map(adt => {
                // let adtName = adt.constructor.toString().substring(0, 20);
                // console.log('DISPOSING: ' + adtName);
                return adt.dispose();
            });
            yield Promise.all(disposePromises);
        });
    }
    exitProcess() {
        console.log('Application has been shutdown, the process exits now!');
        process.exit(); // TODO: Should emit an exit code to also stop Docker instance
    }
    /**
     * Gracefully shutdown the application when user presses Ctrl-C in Console/Terminal,
     * or when the OS is trying to stop the service process.
     *
     */
    handleGracefulShutdown() {
        let handler = () => {
            console.log('Gracefully shutdown...');
            this.stop();
        };
        // SIGINT is the interrupt signal.
        // The Terminal/Console sends it to the foreground process when the user presses Ctrl-C.
        process.on('SIGINT', handler);
        // SIGTERM is the termination signal.
        // Sent by `kill` command, or Upstart, or Heroku dynos, or Docker to shutdown the process.
        // After a period (~10 sec), if the process is still running, SIGKILL will be sent to force immediate termination.
        process.on('SIGTERM', handler);
        // Windows has no such signals, so we need to fake SIGINT:
        /* istanbul ignore else */
        if (process.platform === 'win32') {
            const readLine = require('readline');
            let rl = readLine.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            // When pressing Ctrl-C
            // Read more: https://nodejs.org/api/readline.html#readline_event_sigint
            rl.on('SIGINT', () => {
                /* istanbul ignore next */
                process.emit('SIGINT');
            });
        }
    }
}
exports.MicroServiceBase = MicroServiceBase;

//# sourceMappingURL=MicroServiceBase.js.map
