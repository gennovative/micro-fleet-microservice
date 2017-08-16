/* istanbul ignore else */
if (!Reflect || typeof Reflect['hasOwnMetadata'] !== 'function') {
	require('reflect-metadata');
}

export * from './addons/ConfigurationProvider';
export * from './addons/DatabaseAddOn';
export * from './addons/MessageBrokerAddOn';
export * from './constants/SettingKeys';
export * from './constants/Types';
export * from './microservice/MicroServiceBase';
