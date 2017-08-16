import * as chai from 'chai';
import * as spies from 'chai-spies';
import * as _ from 'lodash';
import { SettingItem, SettingItemDataType } from 'back-lib-common-contracts';
import { CriticalException } from 'back-lib-common-util';
import { IDirectRpcCaller, IRpcResponse, Types as ComT } from 'back-lib-service-communication';

import * as app from '../../app';

const S = app.SettingKeys;

chai.use(spies);
const expect = chai.expect;

// Mock fetched config

const CONFIG_SVC_ADDRESSES = ['127.0.0.1', '127.0.0.2', '127.0.0.3'],
	SUCCESS_CONFIG: SettingItem[] = [
		{
			name: S.SETTINGS_SERVICE_ADDRESSES,
			dataType: SettingItemDataType.String,
			value: JSON.stringify(CONFIG_SVC_ADDRESSES)
		},
		{
			name: S.MSG_BROKER_HOST,
			dataType: SettingItemDataType.String,
			value: '127.0.0.1/rabbitmq'
		},
		{
			name: 'max_conn',
			dataType: SettingItemDataType.Number,
			value: '999'
		},
		{
			name: 'auto_restart',
			dataType: SettingItemDataType.Boolean,
			value: 'true'
		}
	];

class MockDirectRpcCaller implements IDirectRpcCaller {
	public name: string;
	public baseAddress: string;
	
	public call(moduleName: string, action: string, params: any): Promise<IRpcResponse> {
		return new Promise((resolve, reject) => {
			let res: IRpcResponse = {
				isSuccess: true,
				data: null,
				from: 'MockConfigSvc',
				to: 'ThisSvc'
			};
			if (this.baseAddress == CONFIG_SVC_ADDRESSES[0]) {
				// Force to throw error on first address attempt.
				reject('Connection rejected!');
			} else if (this.baseAddress == CONFIG_SVC_ADDRESSES[1]) {
				// Force to fail on second attempt.
				res.isSuccess = false;
				resolve(res);
			} else {
				res.data = SUCCESS_CONFIG;
				resolve(res);
			}
		});
	}
	
	public init(param: any): void {
	}

	public onError(handler: (err) => void): void {
	}
}

describe('ConfigurationProvider', () => {
	
	describe('init', () => {
		it('should load file config', async () => {
			// Arrange
			let configPrvd = new app.ConfigurationProvider(new MockDirectRpcCaller());

			// Act
			await configPrvd.init();

			// Assert			
			expect(configPrvd['_fileSettings']).to.be.not.null;
		});
		
		it('should not load file settings if cannot load file', async () => {
			// Arrange
			let configPrvd = new app.ConfigurationProvider(new MockDirectRpcCaller());
			configPrvd['_configFilePath'] = 'dummy.json';

			// Act
			await configPrvd.init();

			// Assert
			expect(configPrvd['_fileSettings']).to.be.empty;
		});
	});

	describe('get enableRemote', () => {
		it('should return value of `enableRemote`', () => {
			// Arrange
			let configPrvd = new app.ConfigurationProvider(new MockDirectRpcCaller());

			// Act and assert
			configPrvd['_enableRemote'] = false;
			expect(configPrvd.enableRemote).to.be.false;
			
			configPrvd['_enableRemote'] = true;
			expect(configPrvd.enableRemote).to.be.true;

		});
	});
	
	describe('set enableRemote', () => {
		it('should set value for `enableRemote`', () => {
			// Arrange
			let configPrvd = new app.ConfigurationProvider(new MockDirectRpcCaller());

			// Act and assert
			configPrvd.enableRemote = false;
			expect(configPrvd['_enableRemote']).to.be.false;
			
			configPrvd.enableRemote = true;
			expect(configPrvd['_enableRemote']).to.be.true;

		});
	});

	describe('get', () => {
		it('should read appconfig.json and return value', async () => {
			// Arrange
			let configPrvd = new app.ConfigurationProvider(new MockDirectRpcCaller()),
				appConfigs = require('../../../appconfig.json'),
				value;

			// Act
			await configPrvd.init();
			value = configPrvd.get(S.SETTINGS_SERVICE_ADDRESSES);

			// Assert
			expect(value).to.equals(appConfigs[S.SETTINGS_SERVICE_ADDRESSES]);
		});

		it('should read settings from environment variable', async () => {
			// Arrange
			process.env[S.SETTINGS_SERVICE_ADDRESSES] = '127.0.0.1';
			let configPrvd = new app.ConfigurationProvider(new MockDirectRpcCaller());
			configPrvd['_configFilePath'] = 'dummy.json';

			// Act
			await configPrvd.init();
			let value = configPrvd.get(S.SETTINGS_SERVICE_ADDRESSES);
			
			// Assert
			expect(value).to.equals(process.env[S.SETTINGS_SERVICE_ADDRESSES]);
		});

		it('should read settings from fetched Configuration Service', async () => {
			// Arrange
			let settings = { // Mock fetched config
					[S.MSG_BROKER_HOST]: '127.0.0.1/rabbitmq'
				},
				configPrvd = new app.ConfigurationProvider(new MockDirectRpcCaller()),
				value;
			
			configPrvd['_remoteSettings'] = settings;
			
			// Act
			await configPrvd.init();
			value = configPrvd.get(S.MSG_BROKER_HOST);

			// Assert
			expect(value).to.equals(settings[S.MSG_BROKER_HOST]);
		});
		
		it('should return `null` if cannot find setting for specified key', async () => {
			// Arrange
			const NO_EXIST_KEY = 'imaginary-key';
			let configPrvd = new app.ConfigurationProvider(new MockDirectRpcCaller()),
				value;

			// Act
			await configPrvd.init();
			value = configPrvd.get(NO_EXIST_KEY);

			// Assert
			expect(value).to.be.null;
		});
	});

	describe('fetch', () => {
		it('should throw error if there is no address for Configuration Service', async () => {
			// Arrange
			let configPrvd = new app.ConfigurationProvider(new MockDirectRpcCaller()),
				isSuccess = false;

			// Make it no way to accidentially get a meaningful address.
			configPrvd['_configFilePath'] = 'dummy.json';
			configPrvd['_remoteSettings'] = {};
			process.env[S.SETTINGS_SERVICE_ADDRESSES] = '';

			// Act then assert
			await configPrvd.init();
			try {
				await configPrvd.fetch();
				isSuccess = true;
				expect(isSuccess).to.be.false;
			} catch (err) {
				expect(isSuccess).to.be.false;
				expect(err).to.be.instanceOf(CriticalException);
				expect(err.message).to.equal('No address for Configuration Service!');
			}
		});

		it('should try each address in the list until success', async () => {
			// Arrange
			// Mock config service addresses
			process.env[S.SETTINGS_SERVICE_ADDRESSES] = JSON.stringify(CONFIG_SVC_ADDRESSES);

			let configPrvd = new app.ConfigurationProvider(new MockDirectRpcCaller()),
				value;

			// Act then assert
			await configPrvd.init();
			await configPrvd.fetch();
			value = configPrvd.get(S.MSG_BROKER_HOST);
			expect(value).to.equals(SUCCESS_CONFIG[1].value);
		});

		it('should reject if no address in the list is accessible and private _settings must be an empty object', async () => {
			// Arrange
			// Mock config service addresses
			let addresses = ['127.0.0.1', '127.0.0.2'];
			process.env[S.SETTINGS_SERVICE_ADDRESSES] = JSON.stringify(addresses);

			// Mock function to make request to config service.
			let requestFn = function(options) {
				return new Promise((resolve, reject) => {
					reject('Connection rejected!');
				});
			};

			let configPrvd = new app.ConfigurationProvider(new MockDirectRpcCaller()),
				isSuccess = false, value;
			configPrvd['_requestMaker'] = requestFn;

			// Act then assert
			await configPrvd.init();
			try {
				await configPrvd.fetch();
				isSuccess = true;
				expect(isSuccess).to.be.false;
			} catch (err) {
				expect(isSuccess).to.be.false;
				expect(configPrvd['_remoteSettings']).to.be.empty;
				expect(err).to.be.not.null;
			}
		});
	});
	
	describe('dispose', () => {
		it('should release all resources', async () => {
			// Arrange
			let configPrvd = new app.ConfigurationProvider(new MockDirectRpcCaller()),
				callMe = chai.spy();

			// Act
			await configPrvd.dispose();

			// Assert
			_.forOwn(configPrvd, (value, key) => {
				callMe();
				expect(configPrvd[key], key).to.be.null;
			});
			expect(callMe).to.be.called;
		});
	});
});