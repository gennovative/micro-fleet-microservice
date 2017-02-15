import * as chai from 'chai';
import * as spies from 'chai-spies';
import { Model } from 'objection';

import { KnexDatabaseAdapter, IConfigurationAdapter, SettingKeys as S } from '../../app';

chai.use(spies);

const expect = chai.expect,
	CONN_HOST = 'localhost',
	CONN_USER = 'dbUser',
	CONN_PASS = 'secret',
	CONN_DB = 'randomDb',
	CLIENT_NAME = 'postgres';

class MockConfigAdapter implements IConfigurationAdapter {
	get enableRemote(): boolean {
		return true;
	}

	public get(key: string): string {
		switch (key) {
			case S.CONNECTION_HOST: return CONN_HOST;
			case S.CONNECTION_USER: return CONN_USER;
			case S.CONNECTION_PASSWORD: return CONN_PASS;
			case S.CONNECTION_DATABASE: return CONN_DB;
			default: return null;
		}
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
	});
});