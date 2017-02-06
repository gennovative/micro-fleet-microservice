import { expect } from 'chai';
import { ConfigurationAdapter, SettingKeys as C } from '../../app';

describe('ConfigurationAdapter', () => {
	describe('get ms broker url', () => {
		it('should read appconfig.json and return value', () => {
			let configAdapter = new ConfigurationAdapter(),
				brokerUrl = configAdapter.get(C.MSG_BROKER_URL),
				appConfigs = require('../../../appconfig.json');
			expect(brokerUrl).to.equals(appConfigs[C.MSG_BROKER_URL]);
		});
	});
});