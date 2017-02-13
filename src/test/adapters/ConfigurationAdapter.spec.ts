import { expect } from 'chai';
import { ConfigurationAdapter, SettingKeys as C } from '../../app';

describe('ConfigurationAdapter', () => {
	describe('get', () => {
		it('should read appconfig.json and return value', () => {
			let configAdapter = new ConfigurationAdapter(),
				value = configAdapter.get(C.CONFIG_SERVICE_ADDRESSES),
				appConfigs = require('../../../appconfig.json');
			expect(value).to.equals(appConfigs[C.CONFIG_SERVICE_ADDRESSES]);
		});

		it('should read settings from environment variable', () => {
			process.env[C.CONFIG_SERVICE_ADDRESSES] = '127.0.0.1';
			let configAdapter = new ConfigurationAdapter();
			configAdapter['_configFilePath'] = 'dummy.json';

			let value = configAdapter.get(C.CONFIG_SERVICE_ADDRESSES);
			expect(value).to.equals(process.env[C.CONFIG_SERVICE_ADDRESSES]);
		});

		it('should read settings from fetched Configuration Service', () => {
			let settings = { // Mock fetched config
					[C.MESSAGE_BROKER_URL]: '127.0.0.1/rabbitmq'
				},
				configAdapter = new ConfigurationAdapter(),
				value;
			
			configAdapter['_settings'] = settings;
			value = configAdapter.get(C.MESSAGE_BROKER_URL);

			expect(value).to.equals(settings[C.MESSAGE_BROKER_URL]);
		});
		
		it('should return `undefined` if cannot find setting for specified key', () => {
			let configAdapter = new ConfigurationAdapter(),
				value = configAdapter.get(C.MESSAGE_BROKER_URL);

			expect(value).to.be.undefined;
		});
	});

	describe('fetch', () => {
		it('should reject if there is no address for Configuration Service', (done) => {
			let configAdapter = new ConfigurationAdapter(),
				isSuccess = false;

			// Make it no way to accidentially get a meaningful address.
			configAdapter['_configFilePath'] = 'dummy.json';
			configAdapter['_settings'] = {};
			process.env[C.CONFIG_SERVICE_ADDRESSES] = '';

			configAdapter.fetch()
				.then(() => {
					isSuccess = true;
					expect(isSuccess).to.be.false;
					done();
				})
				.catch(err => {
					expect(isSuccess).to.be.false;
					expect(err).to.be.not.null;
					done();
				});
		});

		it('should try each address in the list until success', (done) => {
			// Mock config service addresses
			let addresses = ['127.0.0.1', '127.0.0.2'];
			process.env[C.CONFIG_SERVICE_ADDRESSES] = `${addresses[0]};${addresses[1]}`;

			// Mock fetched config
			let fetchedConfig = {
					success: true,
					settings: {
						[C.MESSAGE_BROKER_URL]: '127.0.0.1/rabbitmq'
					}
				};

			// Mock function to make request to config service.
			let requestFn = function(options) {
				return new Promise((resolve, reject) => {
					// Force to fail on first address attempt.
					if (options.uri == addresses[0]) {
						reject('Connection rejected!');
					} else {
						resolve(fetchedConfig);
					}
				});
			};

			let configAdapter = new ConfigurationAdapter(requestFn),
				value;
			configAdapter.fetch()
				.then(() => {
					value = configAdapter.get(C.MESSAGE_BROKER_URL);
					expect(value).to.equals(fetchedConfig.settings[C.MESSAGE_BROKER_URL]);
					done();
				});
		});

		it('should reject if no address in the list is accessible and private _settings must be an empty object', (done) => {
			// Mock config service addresses
			let addresses = ['127.0.0.1', '127.0.0.2'];
			process.env[C.CONFIG_SERVICE_ADDRESSES] = `${addresses[0]};${addresses[1]}`;

			// Mock function to make request to config service.
			let requestFn = function(options) {
				return new Promise((resolve, reject) => {
					reject('Connection rejected!');
				});
			};

			let configAdapter = new ConfigurationAdapter(requestFn),
				isSuccess = false, value;
			configAdapter.fetch()
				.then(() => {
					isSuccess = true;
					expect(isSuccess).to.be.false;
					done();
				})
				.catch(err => {
					expect(isSuccess).to.be.false;
					expect(configAdapter['_settings']).to.be.empty;
					expect(err).to.be.not.null;
					done();
				});
		});
	});
});