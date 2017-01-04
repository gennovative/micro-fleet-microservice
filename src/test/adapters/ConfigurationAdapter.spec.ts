import { expect } from 'chai';
import C = require('../../app/constants/SettingKeys');
import { ConfigurationAdapter } from '../../app/adapters/ConfigurationAdapter';

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