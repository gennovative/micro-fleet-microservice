import * as chai from 'chai';
import * as spies from 'chai-spies';
import * as _ from 'lodash';
import * as app from '../../app';

const S = app.SettingKeys;

chai.use(spies);
const expect = chai.expect;

class MockDirectRpcCaller implements app.IDirectRpcCaller {
	public name: string;
	public baseAddress: string;
	
	public call(moduleName: string, action: string, params: any): Promise<app.IRpcResponse> {
		return null;
	}
	
	public init(param: any): void {
	}
}

describe.skip('ConfigurationProvider', () => {
	
	describe('init', () => {
		it('should load file config', async () => {
			// Arrange
			let configAdapter = new app.ConfigurationProvider(new MockDirectRpcCaller());

			// Act
			await configAdapter.init();

			// Assert			
			expect(configAdapter['_fileSettings']).to.be.not.null;
		});
		
		it('should not load file settings if cannot load file', async () => {
			// Arrange
			let configAdapter = new app.ConfigurationProvider(new MockDirectRpcCaller());
			configAdapter['_configFilePath'] = 'dummy.json';

			// Act
			await configAdapter.init();

			// Assert
			expect(configAdapter['_fileSettings']).to.be.empty;
		});
	});

	describe('get enableRemote', () => {
		it('should return value of `enableRemote`', () => {
			// Arrange
			let configAdapter = new app.ConfigurationProvider(new MockDirectRpcCaller());

			// Act and assert
			configAdapter['_enableRemote'] = false;
			expect(configAdapter.enableRemote).to.be.false;
			
			configAdapter['_enableRemote'] = true;
			expect(configAdapter.enableRemote).to.be.true;

		});
	});
	
	describe('set enableRemote', () => {
		it('should set value for `enableRemote`', () => {
			// Arrange
			let configAdapter = new app.ConfigurationProvider(new MockDirectRpcCaller());

			// Act and assert
			configAdapter.enableRemote = false;
			expect(configAdapter['_enableRemote']).to.be.false;
			
			configAdapter.enableRemote = true;
			expect(configAdapter['_enableRemote']).to.be.true;

		});
	});

	describe('get', () => {
		it('should read appconfig.json and return value', async () => {
			// Arrange
			let configAdapter = new app.ConfigurationProvider(new MockDirectRpcCaller()),
				appConfigs = require('../../../appconfig.json'),
				value;

			// Act
			await configAdapter.init();
			value = configAdapter.get(S.CONFIG_SERVICE_ADDRESSES);

			// Assert
			expect(value).to.equals(appConfigs[S.CONFIG_SERVICE_ADDRESSES]);
		});

		it('should read settings from environment variable', async () => {
			// Arrange
			process.env[S.CONFIG_SERVICE_ADDRESSES] = '127.0.0.1';
			let configAdapter = new app.ConfigurationProvider(new MockDirectRpcCaller());
			configAdapter['_configFilePath'] = 'dummy.json';

			// Act
			await configAdapter.init();
			let value = configAdapter.get(S.CONFIG_SERVICE_ADDRESSES);
			
			// Assert
			expect(value).to.equals(process.env[S.CONFIG_SERVICE_ADDRESSES]);
		});

		it('should read settings from fetched Configuration Service', async () => {
			// Arrange
			let settings = { // Mock fetched config
					[S.MSG_BROKER_HOST]: '127.0.0.1/rabbitmq'
				},
				configAdapter = new app.ConfigurationProvider(new MockDirectRpcCaller()),
				value;
			
			configAdapter['_remoteSettings'] = settings;
			
			// Act
			await configAdapter.init();
			value = configAdapter.get(S.MSG_BROKER_HOST);

			// Assert
			expect(value).to.equals(settings[S.MSG_BROKER_HOST]);
		});
		
		it('should return `null` if cannot find setting for specified key', async () => {
			// Arrange
			let configAdapter = new app.ConfigurationProvider(new MockDirectRpcCaller()),
				value;

			// Act
			await configAdapter.init();
			value = configAdapter.get(S.MSG_BROKER_HOST);

			// Assert
			expect(value).to.be.null;
		});
	});

	describe('fetch', () => {
		it('should throw error if there is no address for Configuration Service', async () => {
			// Arrange
			let configAdapter = new app.ConfigurationProvider(new MockDirectRpcCaller()),
				isSuccess = false;

			// Make it no way to accidentially get a meaningful address.
			configAdapter['_configFilePath'] = 'dummy.json';
			configAdapter['_remoteSettings'] = {};
			process.env[S.CONFIG_SERVICE_ADDRESSES] = '';

			// Act then assert
			await configAdapter.init();
			try {
				await configAdapter.fetch();
				isSuccess = true;
				expect(isSuccess).to.be.false;
			} catch (err) {
				expect(isSuccess).to.be.false;
				expect(err).to.equal('No address for Configuration Service!');
			}
		});

		it('should try each address in the list until success', async () => {
			// Arrange
			// Mock config service addresses
			let addresses = ['127.0.0.1', '127.0.0.2', '127.0.0.3'];
			process.env[S.CONFIG_SERVICE_ADDRESSES] = `${addresses[0]};${addresses[1]};${addresses[2]}`;

			// Mock fetched config
			let successConfig = {
					success: true,
					settings: {
						[S.MSG_BROKER_HOST]: '127.0.0.1/rabbitmq'
					}
				},
				failConfig = {
					success: false
				};

			// Mock function to make request to config service.
			let requestFn = function(options) {
				return new Promise((resolve, reject) => {
					if (options.uri == addresses[0]) {
						// Force to throw error on first address attempt.
						reject('Connection rejected!');
					} else if (options.uri == addresses[1]) {
						// Force to fail on second attempt.
						resolve(failConfig);
					} else {
						resolve(successConfig);
					}
				});
			};

			let configAdapter = new app.ConfigurationProvider(new MockDirectRpcCaller()),
				value;
			configAdapter['_requestMaker'] = requestFn;

			// Act then assert
			await configAdapter.init();
			await configAdapter.fetch();
			value = configAdapter.get(S.MSG_BROKER_HOST);
			expect(value).to.equals(successConfig.settings[S.MSG_BROKER_HOST]);
		});

		it('should reject if no address in the list is accessible and private _settings must be an empty object', async () => {
			// Arrange
			// Mock config service addresses
			let addresses = ['127.0.0.1', '127.0.0.2'];
			process.env[S.CONFIG_SERVICE_ADDRESSES] = `${addresses[0]};${addresses[1]}`;

			// Mock function to make request to config service.
			let requestFn = function(options) {
				return new Promise((resolve, reject) => {
					reject('Connection rejected!');
				});
			};

			let configAdapter = new app.ConfigurationProvider(new MockDirectRpcCaller()),
				isSuccess = false, value;
			configAdapter['_requestMaker'] = requestFn;

			// Act then assert
			await configAdapter.init();
			try {
				await configAdapter.fetch();
				isSuccess = true;
				expect(isSuccess).to.be.false;
			} catch (err) {
				expect(isSuccess).to.be.false;
				expect(configAdapter['_remoteSettings']).to.be.empty;
				expect(err).to.be.not.null;
			}
		});
	});
	
	describe('dispose', () => {
		it('should release all resources', async () => {
			// Arrange
			let configAdapter = new app.ConfigurationProvider(new MockDirectRpcCaller()),
				callMe = chai.spy();

			// Act
			await configAdapter.dispose();

			// Assert
			_.forOwn(configAdapter, (value, key) => {
				callMe();
				expect(configAdapter[key], key).to.be.null;
			});
			expect(callMe).to.be.called;
		});
	});
});