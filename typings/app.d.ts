/// <reference path="./global.d.ts" />

declare module 'back-lib-foundation/constants/SettingKeys' {
	export class SettingKeys {
	    static readonly SETTINGS_SERVICE_ADDRESSES: string;
	    static readonly DB_NUM_CONN: string;
	    static readonly DB_ENGINE: string;
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
	    static readonly SERVICE_SLUG: string;
	}

}
declare module 'back-lib-foundation/constants/Types' {
	export class Types {
	    static readonly MODEL_MAPPER: symbol;
	    static readonly BROKER_ADDON: symbol;
	    static readonly CONFIG_PROVIDER: symbol;
	    static readonly DB_ADDON: symbol;
	    static readonly DEPENDENCY_CONTAINER: symbol;
	}

}
declare module 'back-lib-foundation/addons/ConfigurationProvider' {
	import { IDirectRpcCaller } from 'back-lib-service-communication';
	export interface IConfigurationProvider extends IServiceAddOn {
	    enableRemote: boolean;
	    get(key: string): number & boolean & string;
	    fetch(): Promise<boolean>;
	}
	/**
	 * Provides settings from appconfig.json, environmental variables and remote settings service.
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
	    get(key: string): number & boolean & string;
	    /**
	     * Attempts to fetch settings from remote Configuration Service.
	     */
	    fetch(): Promise<boolean>;
	    	    	    	}

}
declare module 'back-lib-foundation/addons/DatabaseAddOn' {
	import { IDatabaseConnector } from 'back-lib-persistence';
	import { IConfigurationProvider } from 'back-lib-foundation/addons/ConfigurationProvider';
	export interface IDatabaseAddOn extends IServiceAddOn {
	}
	/**
	 * Initializes database connections.
	 */
	export class DatabaseAddOn implements IDatabaseAddOn {
	    	    	    constructor(_configProvider: IConfigurationProvider, _dbConnector: IDatabaseConnector);
	    init(): Promise<void>;
	    dispose(): Promise<void>;
	    	    	}

}
declare module 'back-lib-foundation/addons/MessageBrokerAddOn' {
	import { IMessageBrokerConnector } from 'back-lib-service-communication';
	import { IConfigurationProvider } from 'back-lib-foundation/addons/ConfigurationProvider';
	export class MessageBrokerAddOn implements IServiceAddOn {
	    	    	    constructor(_configProvider: IConfigurationProvider, _msgBrokerCnn: IMessageBrokerConnector);
	    init(): Promise<void>;
	    dispose(): Promise<void>;
	}

}
declare module 'back-lib-foundation/microservice/MicroServiceBase' {
	import * as cm from 'back-lib-common-util';
	import * as cfg from 'back-lib-foundation/addons/ConfigurationProvider';
	import * as db from 'back-lib-foundation/addons/DatabaseAddOn';
	import { MessageBrokerAddOn } from 'back-lib-foundation/addons/MessageBrokerAddOn';
	export abstract class MicroServiceBase {
	    protected _configProvider: cfg.IConfigurationProvider;
	    protected _depContainer: cm.IDependencyContainer;
	    protected _addons: IServiceAddOn[];
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
	     * @return Total number of add-ons that have been added so far.
	     */
	    protected attachAddOn(addon: IServiceAddOn): number;
	    protected attachDbAddOn(): db.IDatabaseAddOn;
	    protected attachConfigProvider(): cfg.IConfigurationProvider;
	    protected attachMessageBrokerAddOn(): MessageBrokerAddOn;
	    protected registerDbAddOn(): void;
	    protected registerConfigProvider(): void;
	    protected registerDirectRpcCaller(): void;
	    protected registerDirectRpcHandler(): void;
	    protected registerMessageBrokerAddOn(): void;
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
	    	    	    	    /**
	     * Gracefully shutdown the application when user presses Ctrl-C in Console/Terminal,
	     * or when the OS is trying to stop the service process.
	     *
	     */
	    	}

}
declare module 'back-lib-foundation' {
	export * from 'back-lib-foundation/addons/ConfigurationProvider';
	export * from 'back-lib-foundation/addons/DatabaseAddOn';
	export * from 'back-lib-foundation/addons/MessageBrokerAddOn';
	export * from 'back-lib-foundation/constants/SettingKeys';
	export * from 'back-lib-foundation/constants/Types';
	export * from 'back-lib-foundation/microservice/MicroServiceBase';

}
