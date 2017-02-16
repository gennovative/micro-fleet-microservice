import * as chai from 'chai';
import * as spies from 'chai-spies';
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
	CONN_FILE = './database-adapter-test.sqlite',
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

	public init(): Promise<boolean> {
		return Promise.resolve(true);
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
			let dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter()),
				spyKnex = chai.spy();
			dbAdapter['_knex'] = spyKnex;

			// Act
			let result = await dbAdapter.init();

			// Assert
			expect(result).to.be.true;
			expect(dbAdapter['_knex']).to.be.spy;
			expect(dbAdapter['_knex']).to.have.been.called.once;
		});
		
		it('should configure ObjectionJS with Knex', async () => {
			// Arrange
			let dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter());
			chai.spy.on(Model, 'knex');

			// Act
			let result = await dbAdapter.init();
			// Assert
			expect(result).to.be.true;
			expect(Model.knex).to.be.spy;
			expect(Model.knex).to.have.been.called.once;
		});
		
		it('should configure connection with file name settings', async () => {
			// Arrange
			let dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter(MODE_FILE)),
				expectedSettings = {
					client: dbAdapter.clientName, 
					useNullAsDefault: true,
					connection: { 
						filename: CONN_FILE
					}
				};
			chai.spy.on(dbAdapter, '_knex');

			// Act
			let result = await dbAdapter.init();

			// Assert
			expect(result).to.be.true;
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
			chai.spy.on(dbAdapter, '_knex');

			// Act
			let result = await dbAdapter.init();

			// Assert
			expect(result).to.be.true;
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
			chai.spy.on(dbAdapter, '_knex');

			// Act
			let result = await dbAdapter.init();

			// Assert
			expect(result).to.be.true;
			expect(dbAdapter['_knex']).to.be.spy;
			expect(dbAdapter['_knex']).to.have.been.called.with(expectedSettings);
		});
		
		it('should throw exception if there is no settings for database connection', async () => {
			// Arrange
			let dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter('')),
				exception = null,
				result = false;
			chai.spy.on(dbAdapter, '_knex');

			// Act
			try {
				result = await dbAdapter.init();
			} catch (ex) {
				exception = ex;
			}

			// Assert
			expect(result).to.be.false;
			expect(exception).to.be.not.null;
			expect(exception).to.equal('No database settings!');
		});
	});
});