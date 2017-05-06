/// <reference path="./globals.d.ts" />

declare module 'back-lib-foundation/constants/SettingKeys' {
	export class SettingKeys {
	    static readonly CONFIG_SERVICE_ADDRESSES: string;
	    static readonly DB_HOST: string;
	    static readonly DB_USER: string;
	    static readonly DB_PASSWORD: string;
	    static readonly DB_NAME: string;
	    static readonly DB_FILE: string;
	    static readonly DB_CONN_STRING: string;
	    static readonly MSG_BROKER_HOST: string;
	    static readonly MSG_BROKER_EXCHANGE: string;
	    static readonly MSG_BROKER_QUEUE: string;
	    static readonly MSG_BROKER_RECONN_TIMEOUT: string;
	    static readonly MSG_BROKER_USERNAME: string;
	    static readonly MSG_BROKER_PASSWORD: string;
	    static readonly SERVICE_NAME: string;
	}

}
declare module 'back-lib-foundation/constants/Types' {
	export class Types {
	    static readonly MODEL_MAPPER: symbol;
	    static readonly BROKER_ADAPTER: symbol;
	    static readonly CONFIG_PROVIDER: symbol;
	    static readonly DB_ADAPTER: symbol;
	    static readonly DEPENDENCY_CONTAINER: symbol;
	}

}
declare module 'back-lib-foundation/adapters/ConfigurationProvider' {
	import { IDirectRpcCaller } from 'back-lib-service-communication';
	export interface IConfigurationProvider extends IAdapter {
	    enableRemote: boolean;
	    get(key: string): string;
	    fetch(): Promise<boolean>;
	}
	/**
	 * Provides settings from package
	 */
	export class ConfigurationProvider implements IConfigurationProvider {
	    constructor(_rpcCaller: IDirectRpcCaller);
	    enableRemote: boolean;
	    init(): Promise<void>;
	    dispose(): Promise<void>;
	    /**
	     * Attempts to get settings from cached Configuration Service, environmetal variable,
	     * and `appconfig.json` file, respectedly.
	     */
	    get(key: string): string;
	    /**
	     * Attempts to fetch settings from remote Configuration Service.
	     */
	    fetch(): Promise<boolean>;
	}

}
declare module 'back-lib-foundation/adapters/DatabaseAdapter' {
	/// <reference types="back-lib-persistence" />
	import { IDatabaseConnector } from 'back-lib-persistence';
	import { IConfigurationProvider } from 'back-lib-foundation/adapters/ConfigurationProvider';
	export interface IDatabaseAdapter extends IAdapter {
	    dispose(): Promise<void>;
	}
	/**
	 * Provides settings from package
	 */
	export class KnexDatabaseAdapter implements IDatabaseAdapter {
	    constructor(_configProvider: IConfigurationProvider, _dbConnector: IDatabaseConnector);
	    init(): Promise<void>;
	    dispose(): Promise<void>;
	}

}
declare module 'back-lib-foundation/adapters/MessageBrokerAdapter' {
	import { IMessageBrokerConnector } from 'back-lib-service-communication';
	import { IConfigurationProvider } from 'back-lib-foundation/adapters/ConfigurationProvider';
	export class MessageBrokerAdapter implements IAdapter {
	    constructor(_configProvider: IConfigurationProvider, _msgBrokerCnn: IMessageBrokerConnector);
	    init(): Promise<void>;
	    dispose(): Promise<void>;
	}

}
declare module 'back-lib-foundation/microservice/MicroServiceBase' {
	import * as cm from 'back-lib-common-util';
	import * as cf from 'back-lib-foundation/adapters/ConfigurationProvider';
	import * as db from 'back-lib-foundation/adapters/DatabaseAdapter';
	import { MessageBrokerAdapter } from 'back-lib-foundation/adapters/MessageBrokerAdapter';
	export abstract class MicroServiceBase {
	    protected _configAdapter: cf.IConfigurationProvider;
	    protected _depContainer: cm.IDependencyContainer;
	    protected _adapters: IAdapter[];
	    protected _isStarted: boolean;
	    constructor();
	    readonly isStarted: boolean;
	    /**
	     * Bootstraps this service application.
	     */
	    start(): void;
	    /**
	     * Gracefully stops this application and exit
	     */
	    stop(exitProcess?: boolean): void;
	    /**
	     * @return Total number of adapters that have been added so far.
	     */
	    protected addAdapter(adapter: IAdapter): number;
	    protected addDbAdapter(): db.IDatabaseAdapter;
	    protected addConfigAdapter(): cf.IConfigurationProvider;
	    protected addMessageBrokerAdapter(): MessageBrokerAdapter;
	    protected registerDbAdapter(): void;
	    protected registerConfigProvider(): void;
	    protected registerDirectRpcCaller(): void;
	    protected registerDirectRpcHandler(): void;
	    protected registerMessageBrokerAdapter(): void;
	    protected registerMediateRpcCaller(): void;
	    protected registerMediateRpcHandler(): void;
	    protected registerModelMapper(): void;
	    protected registerDependencies(): void;
	    /**
	     * Invoked whenever any error occurs in the application.
	     */
	    protected onError(error: any): void;
	    /**
	     * Invoked after registering dependencies, but before all other initializations.
	     */
	    protected onStarting(): void;
	    /**
	     * Invoked after all initializations. At this stage, the application is considered
	     * started successfully.
	     */
	    protected onStarted(): void;
	    /**
	     * Invoked when `stop` method is called, before any other actions take place.
	     */
	    protected onStopping(): void;
	    /**
	     * Invoked after all finalizations have finished. At this stage, the application is
	     * considered stopped successfully. The process will be killed after this.
	     */
	    protected onStopped(): void;
	}

}
declare module 'back-lib-foundation' {
	import 'reflect-metadata';
	import 'automapper-ts';
	export * from 'back-lib-foundation/adapters/ConfigurationProvider';
	export * from 'back-lib-foundation/adapters/DatabaseAdapter';
	export * from 'back-lib-foundation/adapters/MessageBrokerAdapter';
	export * from 'back-lib-foundation/constants/SettingKeys';
	export * from 'back-lib-foundation/constants/Types';
	export * from 'back-lib-foundation/microservice/MicroServiceBase';

}
