import * as chai from 'chai';
import * as spies from 'chai-spies';
import * as _ from 'lodash';
import { Model } from 'objection';

import { KnexDatabaseAdapter, IConfigurationAdapter, SettingKeys as S } from '../../app';

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
	CLIENT_NAME = 'postgres';

class MockConfigAdapter implements IConfigurationAdapter {
	
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

describe('KnexDatabaseAdapter', () => {

	describe('get clientName', () => {
		it('should return value of `clientName`', () => {
			// Arrange
			let dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter());

			// Act and assert
			dbAdapter['_clientName'] = CLIENT_NAME;
			expect(dbAdapter.clientName).to.equal(CLIENT_NAME);
		});
	});
	
	describe('set clientName', () => {
		it('should set value for `clientName`', () => {
			// Arrange
			let dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter());

			// Act and assert
			dbAdapter.clientName = CLIENT_NAME;
			expect(dbAdapter['_clientName']).to.equal(CLIENT_NAME);
		});
	});

	describe('init', () => {
		it('should configure database connection with Knex', async () => {
			// Arrange
			let dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter());
			
			// Replace with spy function
			dbAdapter['_knex'] = chai.spy();

			// Act
			await dbAdapter.init();

			// Assert
			expect(dbAdapter['_knex']).to.be.spy;
			expect(dbAdapter['_knex']).to.have.been.called.once;
		});
		
		it('should configure ObjectionJS with Knex', async () => {
			// Arrange
			let dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter(MODE_FILE)),
				modelKnex = Model.knex;
			
			dbAdapter.clientName = 'sqlite3';
			// Spy on this method, because we need the real function be called.
			chai.spy.on(dbAdapter, '_knex');
			chai.spy.on(Model, 'knex');

			// Act
			await dbAdapter.init();

			// Assert
			expect(Model.knex).to.be.spy;
			expect(Model.knex).to.have.been.called.once;
			
			// Give back original function, because this is global library.
			Model['knex'] = modelKnex;
		});
		
		it('should configure connection with file name settings', async () => {
			// Arrange
			let dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter(MODE_FILE)),
				expectedSettings;
			
			dbAdapter.clientName = 'sqlite3';
			expectedSettings = {
					client: dbAdapter.clientName, 
					useNullAsDefault: true,
					connection: { 
						filename: CONN_FILE
					}
				};
			
			// Spy on this method, because we need the real function be called.
			chai.spy.on(dbAdapter, '_knex');

			// Act
			await dbAdapter.init();

			// Assert
			expect(dbAdapter['_knex']).to.be.spy;
			expect(dbAdapter['_knex']).to.have.been.called.with(expectedSettings);
		});
		
		it('should configure connection with connection string', async () => {
			// Arrange
			let dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter(MODE_STRING)),
				expectedSettings = {
					client: dbAdapter.clientName,
					useNullAsDefault: true,
					connection: CONN_STRING
				};
			dbAdapter['_knex'] = chai.spy();

			// Act
			await dbAdapter.init();

			// Assert
			expect(dbAdapter['_knex']).to.be.spy;
			expect(dbAdapter['_knex']).to.have.been.called.with(expectedSettings);
		});
		
		it('should configure connection with host credentials', async () => {
			// Arrange
			let dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter(MODE_CREDENTIALS)),
				expectedSettings = {
					client: dbAdapter.clientName,
					useNullAsDefault: true,
					connection: {
						host: CONN_HOST,
						user: CONN_USER,
						password: CONN_PASS,
						database: CONN_DB,
					}
				};
			dbAdapter['_knex'] = chai.spy();

			// Act
			await dbAdapter.init();

			// Assert
			expect(dbAdapter['_knex']).to.be.spy;
			expect(dbAdapter['_knex']).to.have.been.called.with(expectedSettings);
		});
		
		it('should throw exception if there is no settings for database connection', async () => {
			// Arrange
			let dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter('')),
				exception = null,
				isSuccess = false;
			dbAdapter['_knex'] = chai.spy();

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
	});
	
	describe('dispose', () => {
		it('should release all resources', async () => {
			// Arrange

			let dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter(MODE_FILE)),
				callMe = chai.spy();

			// Act
			dbAdapter.clientName = 'sqlite3';
			await dbAdapter.init();
			await dbAdapter.dispose();

			// Assert
			_.forOwn(dbAdapter, (value, key) => {
				callMe();
				expect(dbAdapter[key], key).to.be.null;
			});
			expect(callMe).to.be.called;
		});
	});
});