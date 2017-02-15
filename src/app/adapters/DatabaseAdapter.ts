import * as knex from 'knex';
import { Model } from 'objection';

import { IAdapter } from './IAdapter';
import { IConfigurationAdapter } from './ConfigurationAdapter';
import { injectable, inject } from '../utils/DependencyContainer';
import { SettingKeys as S } from '../constants/SettingKeys';
import { Types as T } from '../constants/Types';


export interface IDatabaseAdapter extends IAdapter {
	clientName: string;
}

/**
 * Provides settings from package
 */
@injectable()
export class KnexDatabaseAdapter implements IDatabaseAdapter {
	
	private _clientName: string;
	private _knex; // for unittest mocking

	constructor(
		@inject(T.CONFIG_ADAPTER) private _configAdapter: IConfigurationAdapter
	) {
		this._clientName = 'pg';
		this._knex = knex;
		console.log('KNEXT: ' + typeof knex);
	}

	public get clientName(): string {
		return this._clientName;
	}

	public set clientName(value: string) {
		this._clientName = value;
	}

	public init(): Promise<boolean> {
		let cfgAdt = this._configAdapter,
			k = this._knex({client: this._clientName, connection: {
					host: cfgAdt.get(S.CONNECTION_HOST),
					user: cfgAdt.get(S.CONNECTION_USER),
					password: cfgAdt.get(S.CONNECTION_PASSWORD),
					database: cfgAdt.get(S.CONNECTION_DATABASE),
				}
			});
		Model.knex(k);
		return Promise.resolve(true);
	}
}