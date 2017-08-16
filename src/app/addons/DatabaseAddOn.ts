import { injectable, inject, Guard, CriticalException } from 'back-lib-common-util';
import { IDatabaseConnector, IConnectionDetail, Types as PerT } from 'back-lib-persistence';

import { IConfigurationProvider } from './ConfigurationProvider';
import { SettingKeys as S } from '../constants/SettingKeys';
import { Types as T } from '../constants/Types';

export interface IDatabaseAddOn extends IServiceAddOn {
}

/**
 * Initializes database connections.
 */
@injectable()
export class DatabaseAddOn implements IDatabaseAddOn {
	
	constructor(
		@inject(T.CONFIG_PROVIDER) private _configProvider: IConfigurationProvider,
		@inject(PerT.DB_CONNECTOR) private _dbConnector: IDatabaseConnector
	) {
		Guard.assertArgDefined('_configProvider', _configProvider);
		Guard.assertArgDefined('_dbConnector', _dbConnector);
	}

	public init(): Promise<void> {
		return new Promise<void>(resolve => {
			this.addConnections();
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


	private addConnections(): void {
		let nConn = <number>this._configProvider.get(S.DB_NUM_CONN),
			connDetail;

		// TODO 1: Should allow setting "client" from remote configuration (show a dropdown box in GUI).
		// TODO 2: Should allow setting multiple connection from remote configuration.
		for (let i = 0; i < nConn; ++i) {
			connDetail = this.buildConnDetails(i);
			if (!connDetail) { continue; }
			this._dbConnector.addConnection(connDetail);
		}

		if (!this._dbConnector.connections.length) {
		throw new CriticalException('No database settings!');
		}
	}

	private buildConnDetails(connIdx: number): IConnectionDetail {
		let provider = this._configProvider,
			cnnDetail: IConnectionDetail = {
				clientName: provider.get(S.DB_ENGINE + connIdx) // Must belong to `DbClient`
			},
			value: string;

		// 1st priority: connect to a local file.
		value = provider.get(S.DB_FILE + connIdx);
		if (value) {
			cnnDetail.fileName = value;
			return cnnDetail;
		}

		// 2nd priority: connect with a connection string.
		value = provider.get(S.DB_CONN_STRING + connIdx);
		if (value) {
			cnnDetail.connectionString = value;
			return cnnDetail;
		}

		// Last priority: connect with host credentials.
		value = provider.get(S.DB_HOST + connIdx);
		if (value) {
			cnnDetail.host = {
				address: provider.get(S.DB_HOST + connIdx),
				user: provider.get(S.DB_USER + connIdx),
				password: provider.get(S.DB_PASSWORD + connIdx),
				database: provider.get(S.DB_NAME + connIdx),
			};
			return cnnDetail;
		}
		return null;
	}
}