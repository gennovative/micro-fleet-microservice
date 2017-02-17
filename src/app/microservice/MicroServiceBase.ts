import { IAdapter } from '../adapters/IAdapter';
import { IConfigurationAdapter, ConfigurationAdapter } from '../adapters/ConfigurationAdapter';
import { IDatabaseAdapter, KnexDatabaseAdapter } from '../adapters/DatabaseAdapter';
import { DependencyContainer } from '../utils/DependencyContainer';
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
			this.stop();
			return;
		}

		this.initAdapters()
			.then(() => {
				this._isStarted = true;
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
		try {
			this.onStopping();
			this._isStarted = false;
			this.onStopped();
		} catch (ex) {
			this.onError(ex);
		} finally {
			exitProcess &&
				/* istanbul ignore next: only useful on production */ 
				this.exitProcess();
		}
	}
	
	protected addDbAdapter(): void {
		let dbAdt = this._depContainer.resolve<IDatabaseAdapter>(T.DB_ADAPTER);
		this.addAdapter(dbAdt);
	}
	
	protected addAdapter(adapter: IAdapter): void {
		this._adapters.push(adapter);
	}

	protected addConfigAdapter(): void {
		this._configAdapter = this._depContainer.resolve<IConfigurationAdapter>(T.CONFIG_ADAPTER);
		this.addAdapter(this._configAdapter);
	}

	protected registerDependencies(): void {
		this._depContainer = new DependencyContainer();
		this._depContainer.bind<IConfigurationAdapter>(T.CONFIG_ADAPTER, ConfigurationAdapter).asSingleton();
		this._depContainer.bind<IDatabaseAdapter>(T.DB_ADAPTER, KnexDatabaseAdapter).asSingleton();
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
			initPromises = this._adapters.map(adt => adt.init);
		} else {
			throw new CriticalException('Fail to fetch configuration!');
		}

		await Promise.all(initPromises);
	}
	
	private exitProcess() {
		/* istanbul ignore next */
		process.exit(); // TODO: Should emit an exit code to also stop Docker instance
	}
	
}