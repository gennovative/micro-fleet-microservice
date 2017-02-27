import { IAdapter } from '../adapters/IAdapter';
import { IConfigurationAdapter, ConfigurationAdapter } from '../adapters/ConfigurationAdapter';
import { IDatabaseAdapter, KnexDatabaseAdapter } from '../adapters/DatabaseAdapter';
import { IDependencyContainer, DependencyContainer } from '../utils/DependencyContainer';
import { CriticalException } from './Exceptions';
import { Types as T } from '../constants/Types';


export abstract class MicroServiceBase {
	protected _configAdapter: IConfigurationAdapter;
	protected _depContainer: DependencyContainer;
	protected _adapters: IAdapter[];
	protected _isStarted: boolean;
	
	constructor() {
		this._adapters = [];
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
		this.addConfigAdapter();

		try {
			// A chance for derived class to add more adapters or do some customizations.
			this.onStarting();
		} catch (ex) {
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
	public stop(exitProcess: boolean = true): void {
		(async () => {
			try {
				this.onStopping();
				this._depContainer.dispose();
				await this.disposeAdapters();
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
	 * @return Total number of adapters that have been added so far.
	 */
	protected addAdapter(adapter: IAdapter): number {
		return this._adapters.push(adapter);
	}
	
	// TODO: Should ha addAdapterFromContainer

	protected addDbAdapter(): IDatabaseAdapter {
		let dbAdt = this._depContainer.resolve<IDatabaseAdapter>(T.DB_ADAPTER);
		this.addAdapter(dbAdt);
		return dbAdt;
	}

	protected addConfigAdapter(): IConfigurationAdapter {
		let cfgAdt = this._configAdapter = this._depContainer.resolve<IConfigurationAdapter>(T.CONFIG_ADAPTER);
		this.addAdapter(cfgAdt);
		return cfgAdt;
	}

	protected registerDependencies(): void {
		let depCon: IDependencyContainer = this._depContainer = new DependencyContainer();
		depCon.bindConstant<IDependencyContainer>(T.DEPENDENCY_CONTAINER, depCon);
		depCon.bind<IConfigurationAdapter>(T.CONFIG_ADAPTER, ConfigurationAdapter).asSingleton();
		depCon.bind<IDatabaseAdapter>(T.DB_ADAPTER, KnexDatabaseAdapter).asSingleton();
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

	private async initAdapters(): Promise<void> {
		let cfgAdt = this._configAdapter,
			initPromises;

		// Config adapter must be initialized first, because all other adapters
		// depend on it.
		await cfgAdt.init();

		// If remote config is disabled or
		// if remote config is enanbed and fetching successfully.
		if (!cfgAdt.enableRemote || await cfgAdt.fetch()) {
			initPromises = this._adapters.map(adt => adt.init());
		} else {
			throw new CriticalException('Fail to fetch configuration!');
		}

		await Promise.all(initPromises);
	}

	private async disposeAdapters(): Promise<void> {
		let disposePromises = this._adapters.map(adt => {
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