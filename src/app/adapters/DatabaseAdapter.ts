import * as knex from 'knex';
import { Model } from 'objection';

import { injectable, inject } from 'back-lib-common-util';

import { IConfigurationProvider } from './ConfigurationProvider';
import { SettingKeys as S } from '../constants/SettingKeys';
import { Types as T } from '../constants/Types';

/**
 * Db driver names for `IDatabaseAdapter.clientName` property.
 */
export class DbClient {
	/**
	 * Microsoft SQL Server
	 */
	public static readonly MSSQL = 'mssql';
	
	/**
	 * MySQL
	 */
	public static readonly MYSQL = 'mysql';
	
	/**
	 * PostgreSQL
	 */
	public static readonly POSTGRESQL = 'pg';
	
	/**
	 * SQLite 3
	 */
	public static readonly SQLITE3 = 'sqlite3';
}

export interface IDatabaseAdapter extends IAdapter {
	clientName: string;
	dispose(): Promise<void>;
}

/**
 * Provides settings from package
 */
@injectable()
export class KnexDatabaseAdapter implements IDatabaseAdapter {
	
	private _clientName: string;
	private _knex; // for unittest mocking

	constructor(
		@inject(T.CONFIG_PROVIDER) private _configProvider: IConfigurationProvider
	) {
		this._clientName = DbClient.POSTGRESQL;
		this._knex = knex;
	}

	public get clientName(): string {
		return this._clientName;
	}

	public set clientName(value: string) {
		this._clientName = value;
	}

	public init(): Promise<void> {
		return new Promise<void>(resolve => {
			let cfgAdt = this._configProvider,
				settings = {
					client: this._clientName,
					useNullAsDefault: true,
					connection: this.buildConnSettings()
				},
				k = this._knex(settings);
			Model.knex(k);
			resolve();
		});
	}

	public async dispose(): Promise<void> {
		// Casting from Bluebird Promise to Node native Promise
		// This cast is for compiler, hence no effect to runtime performance.
		await Model.knex().destroy();
		this._configProvider = null;
		this._knex = null;
		this._clientName = null;
	}

	private buildConnSettings(): any {
		let cfgAdt = this._configProvider,
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