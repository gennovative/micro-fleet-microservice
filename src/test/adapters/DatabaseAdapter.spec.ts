import * as chai from 'chai';
import * as spies from 'chai-spies';
import * as _ from 'lodash';
import { Model } from 'objection';
import { IDatabaseConnector, IConnectionDetail, QueryCallback, DbClient } from 'back-lib-persistence';

import { KnexDatabaseAdapter, IConfigurationProvider, SettingKeys as S } from '../../app';

chai.use(spies);

const expect = chai.expect,
	MODE_FILE = 'file',
	MODE_STRING = 'string',
	MODE_CREDENTIALS = 'credentials',
	CONN_HOST = 'localhost',
	CONN_USER = 'dbUser',
	CONN_PASS = 'secret',
	CONN_DB = 'randomDb',
	CONN_FILE = `${process.cwd()}/database-adapter-test.sqlite`,
	CONN_STRING = 'msql://localhost@user:pass',
	CLIENT_NAME = DbClient.POSTGRESQL;

class MockConfigAdapter implements IConfigurationProvider {
	
	constructor(private _mode: string = MODE_CREDENTIALS) {
	}

	get enableRemote(): boolean {
		return true;
	}

	public get(key: string): string {
		if (MODE_FILE == this._mode) {
			switch (key) {
				case S.DB_FILE: return CONN_FILE;
				default: return null;
			}
		} else if (MODE_STRING == this._mode) {
			switch (key) {
				case S.DB_CONN_STRING: return CONN_STRING;
				default: return null;
			}
		} else if (MODE_CREDENTIALS  == this._mode) {
			switch (key) {
				case S.DB_HOST: return CONN_HOST;
				case S.DB_USER: return CONN_USER;
				case S.DB_PASSWORD: return CONN_PASS;
				case S.DB_NAME: return CONN_DB;
				default: return null;
			}
		}
		return null;
	}

	public fetch(): Promise<boolean> {
		return Promise.resolve(true);
	}

	public init(): Promise<void> {
		return Promise.resolve();
	}

	public dispose(): Promise<void> {
		return Promise.resolve();
	}
}

class MockDbConnector implements IDatabaseConnector {
	public addConnection(detail: IConnectionDetail, name?: string): void {
	}

	public dispose(): Promise<void> {
		return Promise.resolve();
	}

	public query<TEntity>(EntityClass: any, callback: QueryCallback<TEntity>, ...names: string[]): Promise<any>[] {
		return [Promise.resolve()];
	}
}

describe('KnexDatabaseAdapter', () => {

	describe('init', () => {
		it('should configure database connection with database connector', async () => {
			// Arrange
			let dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter(), new MockDbConnector()),
				addConnSpy = chai.spy.on(dbAdapter['_dbConnector'], 'addConnection');
			
			// Act
			await dbAdapter.init();

			// Assert
			expect(addConnSpy).to.be.spy;
			expect(addConnSpy).to.have.been.called.once;
		});

		it('should throw exception if there is no settings for database connection', async () => {
			// Arrange
			let dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter(''), new MockDbConnector()),
				exception = null,
				isSuccess = false;

			// Act
			try {
				await dbAdapter.init();
				isSuccess = true;
			} catch (ex) {
				exception = ex;
			}

			// Assert
			expect(isSuccess).to.be.false;
			expect(exception).to.be.not.null;
			expect(exception).to.equal('No database settings!');
		});
	}); // describe 'init'
	
	describe('dispose', () => {
		it('should release all resources', async () => {
			// Arrange

			let dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter(MODE_FILE), new MockDbConnector()),
				callMe = chai.spy();

			// Act
			await dbAdapter.init();
			await dbAdapter.dispose();

			// Assert
			_.forOwn(dbAdapter, (value, key) => {
				callMe();
				expect(dbAdapter[key], key).to.be.null;
			});
			expect(callMe).to.be.called;
		});
	}); // describe 'dispose'
});