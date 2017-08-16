"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cm = require("back-lib-common-util");
const per = require("back-lib-persistence");
const com = require("back-lib-service-communication");
const cfg = require("../addons/ConfigurationProvider");
const db = require("../addons/DatabaseAddOn");
const MessageBrokerAddOn_1 = require("../addons/MessageBrokerAddOn");
const Types_1 = require("../constants/Types");
class MicroServiceBase {
    constructor() {
        this._addons = [];
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
        this.attachConfigProvider();
        try {
            // A chance for derived class to add more add-ons or do some customizations.
            this.onStarting();
        }
        catch (ex) {
            this.onError(ex);
            console.error('An error occured on starting, the application has to stop now.');
            this.stop();
            return;
        }
        this.initAddOns()
            .then(() => {
            this._isStarted = true;
            this.handleGracefulShutdown();
            this.onStarted();
        })
            .catch(err => {
            this.onError(err);
            console.error('An error occured on initializing add-ons, the application has to stop now.');
            this.stop();
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
                yield this.disposeAddOns();
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
     * @return Total number of add-ons that have been added so far.
     */
    attachAddOn(addon) {
        return this._addons.push(addon);
    }
    attachDbAddOn() {
        let dbAdt = this._depContainer.resolve(Types_1.Types.DB_ADDON);
        this.attachAddOn(dbAdt);
        return dbAdt;
    }
    attachConfigProvider() {
        let cfgAdt = this._configProvider = this._depContainer.resolve(Types_1.Types.CONFIG_PROVIDER);
        this.attachAddOn(cfgAdt);
        return cfgAdt;
    }
    attachMessageBrokerAddOn() {
        let dbAdt = this._depContainer.resolve(Types_1.Types.BROKER_ADDON);
        this.attachAddOn(dbAdt);
        return dbAdt;
    }
    registerDbAddOn() {
        this._depContainer.bind(per.Types.DB_CONNECTOR, per.KnexDatabaseConnector).asSingleton();
        this._depContainer.bind(Types_1.Types.DB_ADDON, db.DatabaseAddOn).asSingleton();
    }
    registerConfigProvider() {
        this._depContainer.bind(Types_1.Types.CONFIG_PROVIDER, cfg.ConfigurationProvider).asSingleton();
    }
    registerDirectRpcCaller() {
        this._depContainer.bind(com.Types.DIRECT_RPC_CALLER, com.HttpRpcCaller);
    }
    registerDirectRpcHandler() {
        this._depContainer.bind(com.Types.DIRECT_RPC_HANDLER, com.ExpressRpcHandler);
    }
    registerMessageBrokerAddOn() {
        this._depContainer.bind(com.Types.MSG_BROKER_CONNECTOR, com.TopicMessageBrokerConnector).asSingleton();
        this._depContainer.bind(Types_1.Types.BROKER_ADDON, MessageBrokerAddOn_1.MessageBrokerAddOn).asSingleton();
    }
    registerMediateRpcCaller() {
        if (!this._depContainer.isBound(com.Types.MSG_BROKER_CONNECTOR)) {
            this.registerMessageBrokerAddOn();
        }
        this._depContainer.bind(com.Types.MEDIATE_RPC_CALLER, com.MessageBrokerRpcCaller);
    }
    registerMediateRpcHandler() {
        if (!this._depContainer.isBound(com.Types.MSG_BROKER_CONNECTOR)) {
            this.registerMessageBrokerAddOn();
        }
        this._depContainer.bind(com.Types.MEDIATE_RPC_HANDLER, com.MessageBrokerRpcHandler);
    }
    registerDependencies() {
        let depCon = this._depContainer = new cm.DependencyContainer();
        depCon.bindConstant(cm.Types.DEPENDENCY_CONTAINER, depCon);
        this.registerConfigProvider();
        this.registerDirectRpcCaller();
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
    initAddOns() {
        return __awaiter(this, void 0, void 0, function* () {
            let cfgPrvd = this._configProvider, initPromises;
            // Configuration provider must be initialized first, because all other add-ons
            // depend on it.
            yield cfgPrvd.init();
            // If remote config is disabled or
            // if remote config is enanbed and fetching successfully.
            if (!cfgPrvd.enableRemote || (yield cfgPrvd.fetch())) {
                initPromises = this._addons.map(adt => adt.init());
            }
            else {
                throw new cm.CriticalException('Fail to fetch configuration!');
            }
            yield Promise.all(initPromises);
        });
    }
    disposeAddOns() {
        return __awaiter(this, void 0, void 0, function* () {
            let disposePromises = this._addons.map(adt => {
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
