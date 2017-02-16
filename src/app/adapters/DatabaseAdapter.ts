import * as knex from 'knex';
import { Model } from 'objection';

import { IAdapter } from './IAdapter';
import { IConfigurationAdapter } from './ConfigurationAdapter';
import { injectable, inject } from '../utils/DependencyContainer';
import { SettingKeys as S } from '../constants/SettingKeys';
import { Types as T } from '../constants/Types';


export interface IDatabaseAdapter extends IAdapter {
	clientName: string;
	destroy(): Promise<void>;
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
	}

	public get clientName(): string {
		return this._clientName;
	}

	public set clientName(value: string) {
		this._clientName = value;
	}

	public init(): Promise<boolean> {
		let cfgAdt = this._configAdapter,
			settings = {
				client: this._clientName,
				useNullAsDefault: true,
				connection: this.buildConnSettings()
			},
			k = this._knex(settings);

		Model.knex(k);
		return Promise.resolve(true);
	}

	public destroy(): Promise<void> {
		// Casting from Bluebird Promise to Node native Promise
		// This cast is for compiler, hence no effect to runtime performance.
		return <Promise<void>><any>(Model.knex().destroy());
	}

	private buildConnSettings(): any {
		let cfgAdt = this._configAdapter,
			value: string;

		// 1st priority: connect to a local file.
		value = cfgAdt.get(S.DB_FILE);
		if (value && value.length) {
			return { filename: value };
		}

		// 2nd priority: connect with a connection string.
		value = cfgAdt.get(S.DB_CONN_STRING);
		if (value && value.length) {
			return value;
		}

		// Last priority: connect with host credentials.
		value = cfgAdt.get(S.DB_HOST);
		if (value && value.length) {
			return {
				host: cfgAdt.get(S.DB_HOST),
				user: cfgAdt.get(S.DB_USER),
				password: cfgAdt.get(S.DB_PASSWORD),
				database: cfgAdt.get(S.DB_NAME),
			};
		}
		throw 'No database settings!';
	}
}