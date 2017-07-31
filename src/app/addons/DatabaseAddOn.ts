
import { IDatabaseConnector, IConnectionDetail, DbClient, Types as PerT } from 'back-lib-persistence';
import { injectable, inject } from 'back-lib-common-util';

import { IConfigurationProvider } from './ConfigurationProvider';
import { SettingKeys as S } from '../constants/SettingKeys';
import { Types as T } from '../constants/Types';

export interface IDatabaseAddOn extends IServiceAddOn {
	dispose(): Promise<void>;
}

/**
 * Provides settings from package
 */
@injectable()
export class KnexDatabaseAddOn implements IDatabaseAddOn {
	
	constructor(
		@inject(T.CONFIG_PROVIDER) private _configProvider: IConfigurationProvider,
		@inject(PerT.DB_CONNECTOR) private _dbConnector: IDatabaseConnector
	) {
	}

	public init(): Promise<void> {
		return new Promise<void>(resolve => {
			let cfgAdt = this._configProvider,
				settings: IConnectionDetail = this.buildConnSettings();
			
			// TODO 1: Should allow setting "client" from remote configuration (show a dropdown box in GUI).
			// TODO 2: Should allow setting multiple connection from remote configuration.
			this._dbConnector.addConnection(settings);
			resolve();
		});
	}

	public async dispose(): Promise<void> {
		// Casting from Bluebird Promise to Node native Promise
		// This cast is for compiler, hence no effect to runtime performance.
		await this._dbConnector.dispose();
		this._dbConnector = null;
		this._configProvider = null;
	}


	private buildConnSettings(): IConnectionDetail {
		let cfgAdt = this._configProvider,
			cnnDetail: IConnectionDetail = {
				clientName: DbClient.POSTGRESQL
			},
			value: string;

		// 1st priority: connect to a local file.
		value = cfgAdt.get(S.DB_FILE);
		if (value) {
			cnnDetail.fileName = value;
			return cnnDetail;
		}

		// 2nd priority: connect with a connection string.
		value = cfgAdt.get(S.DB_CONN_STRING);
		if (value) {
			cnnDetail.connectionString = value;
			return cnnDetail;
		}

		// Last priority: connect with host credentials.
		value = cfgAdt.get(S.DB_HOST);
		if (value) {
			cnnDetail.host = {
				address: cfgAdt.get(S.DB_HOST),
				user: cfgAdt.get(S.DB_USER),
				password: cfgAdt.get(S.DB_PASSWORD),
				database: cfgAdt.get(S.DB_NAME),
			};
			return cnnDetail;
		}
		throw 'No database settings!';
	}
}