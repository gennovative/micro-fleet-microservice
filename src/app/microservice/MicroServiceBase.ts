import { IAdapter } from '../adapters/IAdapter';
import { IConfigurationAdapter, ConfigurationAdapter } from '../adapters/ConfigurationAdapter';
import { IDatabaseAdapter, KnexDatabaseAdapter } from '../adapters/DatabaseAdapter';
import { DependencyContainer } from '../utils/DependencyContainer';
import { Types as T } from '../constants/Types';


export abstract class MicroServiceBase {
	protected _configAdapter: IConfigurationAdapter;
	protected _depContainer: DependencyContainer;
	protected _adapters: IAdapter[];
	
	constructor() {
		this._adapters = [];
	}

	public start(): void {
		this.registerDependencies();
		this.addConfigAdapter();
		
		// A chance for derived class to add more adapters or do some customizations.
		this.onStarting(this);
		
		this.initAdapters()
			.then(() => {
				this.onStarted(this);
			})
			.catch(err => {
				console.error(err);
				// TODO: Should log to file.
			});
	}

	public stop(): void {
		this.onStopping(this);
		this.onStopped(this);
	}
	

	
	protected addDbAdapter(): void {
		let dbAdt = this._depContainer.resolve<IDatabaseAdapter>(T.DB_ADAPTER);
		this.addAdapter(dbAdt);
	}

	protected onStarting(thisService: MicroServiceBase): void {
	}

	protected onStarted(thisService: MicroServiceBase): void {
	}

	protected onStopping(thisService: MicroServiceBase): void {
	}

	protected onStopped(thisService: MicroServiceBase): void {
	}


	private addAdapter(adapter: IAdapter): void {
		this._adapters.push(adapter);
	}

	private addConfigAdapter(): void {
		this._configAdapter = this._depContainer.resolve<IConfigurationAdapter>(T.CONFIG_ADAPTER);
		this.addAdapter(this._configAdapter);
	}

	private registerDependencies(): void {
		this._depContainer = new DependencyContainer();
		this._depContainer.bind<IConfigurationAdapter>(T.CONFIG_ADAPTER, ConfigurationAdapter);
		this._depContainer.bind<IDatabaseAdapter>(T.DB_ADAPTER, KnexDatabaseAdapter);
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
			throw 'Fail to fetch configuration!';
		}

		await Promise.all(initPromises);
	}
}