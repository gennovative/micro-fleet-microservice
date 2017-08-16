import * as cm from 'back-lib-common-util';
import * as per from 'back-lib-persistence';
import * as com from 'back-lib-service-communication';

import * as cfg from '../addons/ConfigurationProvider';
import * as db from '../addons/DatabaseAddOn';
import { MessageBrokerAddOn } from '../addons/MessageBrokerAddOn';
import { Types as T } from '../constants/Types';


export abstract class MicroServiceBase {
	protected _configProvider: cfg.IConfigurationProvider;
	protected _depContainer: cm.IDependencyContainer;
	protected _addons: IServiceAddOn[];
	protected _isStarted: boolean;
	
	constructor() {
		this._addons = [];
		this._isStarted = false;
	}

	public get isStarted(): boolean {
		return this._isStarted;
	}

	/**
	 * Bootstraps this service application.
	 */
	public start(): void {
		this.registerDependencies();
		this.attachConfigProvider();

		try {
			// A chance for derived class to add more add-ons or do some customizations.
			this.onStarting();
		} catch (ex) {
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
	public stop(exitProcess: boolean = true): void {
		(async () => {
			try {
				this.onStopping();
				this._depContainer.dispose();
				await this.disposeAddOns();
				this._isStarted = false;
				this.onStopped();
			} catch (ex) {
				this.onError(ex);
			} finally {
				exitProcess &&
					/* istanbul ignore next: only useful on production */ 
					this.exitProcess();
			}
		})();
	}

	/**
	 * @return Total number of add-ons that have been added so far.
	 */
	protected attachAddOn(addon: IServiceAddOn): number {
		return this._addons.push(addon);
	}

	protected attachDbAddOn(): db.IDatabaseAddOn {
		let dbAdt = this._depContainer.resolve<db.IDatabaseAddOn>(T.DB_ADDON);
		this.attachAddOn(dbAdt);
		return dbAdt;
	}

	protected attachConfigProvider(): cfg.IConfigurationProvider {
		let cfgAdt = this._configProvider = this._depContainer.resolve<cfg.IConfigurationProvider>(T.CONFIG_PROVIDER);
		this.attachAddOn(cfgAdt);
		return cfgAdt;
	}

	protected attachMessageBrokerAddOn(): MessageBrokerAddOn {
		let dbAdt = this._depContainer.resolve<MessageBrokerAddOn>(T.BROKER_ADDON);
		this.attachAddOn(dbAdt);
		return dbAdt;
	}

	protected registerDbAddOn(): void {
		this._depContainer.bind<per.IDatabaseConnector>(per.Types.DB_CONNECTOR, per.KnexDatabaseConnector).asSingleton();
		this._depContainer.bind<db.IDatabaseAddOn>(T.DB_ADDON, db.DatabaseAddOn).asSingleton();
	}

	protected registerConfigProvider(): void {
		this._depContainer.bind<cfg.IConfigurationProvider>(T.CONFIG_PROVIDER, cfg.ConfigurationProvider).asSingleton();
	}

	protected registerDirectRpcCaller(): void {
		this._depContainer.bind<com.IDirectRpcCaller>(com.Types.DIRECT_RPC_CALLER, com.HttpRpcCaller);
	}

	protected registerDirectRpcHandler(): void {
		this._depContainer.bind<com.IDirectRpcHandler>(com.Types.DIRECT_RPC_HANDLER, com.ExpressRpcHandler);
	}

	protected registerMessageBrokerAddOn(): void {
		this._depContainer.bind<com.IMessageBrokerConnector>(com.Types.MSG_BROKER_CONNECTOR, com.TopicMessageBrokerConnector).asSingleton();
		this._depContainer.bind<MessageBrokerAddOn>(T.BROKER_ADDON, MessageBrokerAddOn).asSingleton();
	}

	protected registerMediateRpcCaller(): void {
		if (!this._depContainer.isBound(com.Types.MSG_BROKER_CONNECTOR)) {
			this.registerMessageBrokerAddOn();
		}
		this._depContainer.bind<com.IMediateRpcCaller>(com.Types.MEDIATE_RPC_CALLER, com.MessageBrokerRpcCaller);
	}

	protected registerMediateRpcHandler(): void {
		if (!this._depContainer.isBound(com.Types.MSG_BROKER_CONNECTOR)) {
			this.registerMessageBrokerAddOn();
		}
		this._depContainer.bind<com.IMediateRpcHandler>(com.Types.MEDIATE_RPC_HANDLER, com.MessageBrokerRpcHandler);
	}

	protected registerDependencies(): void {
		let depCon: cm.IDependencyContainer = this._depContainer = new cm.DependencyContainer();
		depCon.bindConstant<cm.IDependencyContainer>(cm.Types.DEPENDENCY_CONTAINER, depCon);
		this.registerConfigProvider();
		this.registerDirectRpcCaller();
	}
	
	/**
	 * Invoked whenever any error occurs in the application.
	 */
	protected onError(error: any): void {
		/* istanbul ignore next */
		let msg = (error.toString ? error.toString() : error + '');
		console.error(msg); // Should log to file.
	}

	/**
	 * Invoked after registering dependencies, but before all other initializations.
	 */
	protected onStarting(): void {
	}

	/**
	 * Invoked after all initializations. At this stage, the application is considered
	 * started successfully.
	 */
	protected onStarted(): void {
	}

	/**
	 * Invoked when `stop` method is called, before any other actions take place.
	 */
	protected onStopping(): void {
	}

	/**
	 * Invoked after all finalizations have finished. At this stage, the application is 
	 * considered stopped successfully. The process will be killed after this.
	 */
	protected onStopped(): void {
	}

	private async initAddOns(): Promise<void> {
		let cfgPrvd = this._configProvider,
			initPromises;

		// Configuration provider must be initialized first, because all other add-ons
		// depend on it.
		await cfgPrvd.init();

		// If remote config is disabled or
		// if remote config is enanbed and fetching successfully.
		if (!cfgPrvd.enableRemote || await cfgPrvd.fetch()) {
			initPromises = this._addons.map(adt => adt.init());
		} else {
			throw new cm.CriticalException('Fail to fetch configuration!');
		}

		await Promise.all(initPromises);
	}

	private async disposeAddOns(): Promise<void> {
		let disposePromises = this._addons.map(adt => {
			// let adtName = adt.constructor.toString().substring(0, 20);
			// console.log('DISPOSING: ' + adtName);
			return adt.dispose(); 
		});
		await Promise.all(disposePromises);
	}
	
	private exitProcess() {
		console.log('Application has been shutdown, the process exits now!');
		process.exit(); // TODO: Should emit an exit code to also stop Docker instance
	}
	
	/**
	 * Gracefully shutdown the application when user presses Ctrl-C in Console/Terminal,
	 * or when the OS is trying to stop the service process.
	 * 
	 */
	private handleGracefulShutdown() {
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