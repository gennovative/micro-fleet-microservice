"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="debug" />
const debug = require('debug')('mcft:microservice:MicroserviceBase');
const cm = require("@micro-fleet/common");
const cfg = require("../addons/ConfigurationProviderAddOn");
const { SvcSettingKeys: SvcS } = cm.constants;
class MicroServiceBase {
    constructor() {
        this._addons = [];
        this._isStarted = this._isStopping = false;
    }
    get isStarted() {
        return this._isStarted;
    }
    /**
     * Bootstraps this service application.
     */
    start() {
        this.registerDependencies();
        this._attachConfigProvider();
        try {
            // A chance for derived class to add more add-ons or do some customizations.
            this.onStarting();
        }
        catch (ex) {
            this.onError(ex);
            console.error('An error occured on starting, the application has to stop now.');
            this.exitProcess();
            return;
        }
        this._initAddOns()
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
        if (this._isStopping) {
            return;
        }
        this._isStopping = true;
        setTimeout(() => process.exit(), this._configProvider.get(SvcS.STOP_TIMEOUT).tryGetValue(10000));
        (async () => {
            try {
                this.onStopping();
                await this.sendDeadLetters();
                await this.disposeAddOns();
                this._depContainer.dispose();
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
        })();
    }
    /**
     * @return Total number of add-ons that have been added so far.
     */
    attachAddOn(addon) {
        return this._addons.push(addon);
    }
    _attachConfigProvider() {
        const cfgProd = this._configProvider = this._depContainer.resolve(cm.Types.CONFIG_PROVIDER);
        this.attachAddOn(cfgProd);
        return cfgProd;
    }
    _registerConfigProvider() {
        this._depContainer.bind(cm.Types.CONFIG_PROVIDER, cfg.ConfigurationProviderAddOn).asSingleton();
    }
    registerDependencies() {
        const depCon = this._depContainer = new cm.DependencyContainer();
        cm.serviceContext.setDependencyContainer(depCon);
        depCon.bindConstant(cm.Types.DEPENDENCY_CONTAINER, depCon);
        this._registerConfigProvider();
    }
    /**
     * Invoked whenever any error occurs in the application.
     */
    onError(error) {
        /* istanbul ignore next */
        if (error.stack) {
            console.error(error.stack);
        }
        /* istanbul ignore next */
        else {
            const msg = (error.toString ? error.toString() : error + '');
            console.error(msg); // Should log to file.
        }
        if (error instanceof cm.CriticalException) {
            console.warn('A CriticalException is caught by the Service trunk. The service is stopping.');
            this.stop(true);
        }
        else {
            console.warn('A non-critical error is caught by the Service trunk. The service is still running.');
        }
    }
    /**
     * Invoked after registering dependencies, but before all other initializations.
     */
    onStarting() {
        debug('On starting');
    }
    /**
     * Invoked after all initializations. At this stage, the application is considered
     * started successfully.
     */
    onStarted() {
        debug('On started');
        console.log('Microservice started successfully with %d addons', this._addons.length);
    }
    /**
     * Invoked when `stop` method is called, before any other actions take place.
     */
    onStopping() {
        debug('On stopping');
    }
    /**
     * Invoked after all finalizations have finished. At this stage, the application is
     * considered stopped successfully. The process will be killed after this.
     */
    onStopped() {
        debug('On stopped');
    }
    async _initAddOns() {
        debug('Initialzing add-ons');
        const cfgPrvd = this._configProvider;
        // Configuration provider must be initialized first, because all other add-ons
        // depend on it.
        await cfgPrvd.init();
        // If remote config is disabled or
        // if remote config is enanbed and fetching successfully.
        let initPromises;
        if (!cfgPrvd.enableRemote || await cfgPrvd.fetch()) {
            initPromises = this._addons.map(addon => {
                debug(`Init add-on: ${addon.name}`);
                return addon.init();
            });
        }
        else {
            throw new cm.CriticalException('Fail to fetch configuration!');
        }
        await Promise.all(initPromises);
    }
    disposeAddOns() {
        const disposePromises = this._addons.map(addon => {
            debug(`Disposing: ${addon.name}`);
            return addon.dispose();
        });
        return Promise.all(disposePromises);
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
        const handler = () => {
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
            const rl = readLine.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            // When pressing Ctrl-C
            // Read more: https://nodejs.org/api/readline.html#readline_event_sigint
            rl.on('SIGINT', () => {
                /* istanbul ignore next */
                process.emit('SIGINT');
            });
        }
    }
    sendDeadLetters() {
        debug('Sending dead letters');
        return new Promise(resolve => {
            let timer = setTimeout(resolve, this._configProvider.get(SvcS.DEADLETTER_TIMEOUT).tryGetValue(5000));
            const promises = this._addons.map(addon => {
                debug(`Dead letter to: ${addon.name}`);
                return addon.deadLetter();
            });
            Promise.all(promises).then(() => {
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
                resolve();
            });
        })
            .catch(err => this.onError(err));
    }
}
exports.MicroServiceBase = MicroServiceBase;
//# sourceMappingURL=MicroServiceBase.js.map