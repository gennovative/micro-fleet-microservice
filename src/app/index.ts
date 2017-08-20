/* istanbul ignore next */
if (!Reflect || typeof Reflect['hasOwnMetadata'] !== 'function') {
	require('reflect-metadata');
}

export * from './addons/ConfigurationProvider';
export * from './addons/DatabaseAddOn';
export * from './addons/DirectRpcHandlerAddOnBase';
export * from './addons/MediateRpcHandlerAddOnBase';
export * from './addons/MessageBrokerAddOn';
export * from './constants/Types';
export * from './microservice/MicroServiceBase';
