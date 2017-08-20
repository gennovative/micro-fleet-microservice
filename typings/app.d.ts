/// <reference path="./global.d.ts" />

declare module 'back-lib-foundation/dist/app/constants/Types' {
	export class Types {
	    static readonly MODEL_MAPPER: symbol;
	    static readonly BROKER_ADDON: symbol;
	    static readonly CONFIG_PROVIDER: symbol;
	    static readonly DB_ADDON: symbol;
	    static readonly DEPENDENCY_CONTAINER: symbol;
	}

}
declare module 'back-lib-foundation/dist/app/addons/ConfigurationProvider' {
	import { IDirectRpcCaller } from 'back-lib-service-communication';
	export interface IConfigurationProvider extends IServiceAddOn {
	    /**
	     * Turns on or off remote settings fetching.
	     */
	    enableRemote: boolean;
	    /**
	     * Attempts to get settings from cached Configuration Service, environmetal variable,
	     * and `appconfig.json` file, respectedly.
	     */
	    get(key: string): number & boolean & string;
	    /**
	     * Attempts to fetch settings from remote Configuration Service.
	     */
	    fetch(): Promise<boolean>;
	    /**
	     * Invokes everytime new settings are updated.
	     * The callback receives an array of changed setting keys.
	     */
	    onUpdate(listener: (changedKeys: string[]) => void): void;
	}
	/**
	 * Provides settings from appconfig.json, environmental variables and remote settings service.
	 */
	export class ConfigurationProvider implements IConfigurationProvider {
	    	    	    	    	    	    	    	    	    	    	    constructor(_rpcCaller: IDirectRpcCaller);
	    /**
	     * @see IConfigurationProvider.enableRemote
	     */
	    /**
	     * @see IConfigurationProvider.enableRemote
	     */
	    enableRemote: boolean;
	    	    /**
	     * @see IServiceAddOn.init
	     */
	    init(): Promise<void>;
	    /**
	     * @see IServiceAddOn.deadLetter
	     */
	    deadLetter(): Promise<void>;
	    /**
	     * @see IServiceAddOn.dispose
	     */
	    dispose(): Promise<void>;
	    /**
	     * @see IConfigurationProvider.get
	     */
	    get(key: string): number & boolean & string;
	    /**
	     * @see IConfigurationProvider.fetch
	     */
	    fetch(): Promise<boolean>;
	    onUpdate(listener: (changedKeys: string[]) => void): void;
	    	    	    	    	    	    	    	    	}

}
declare module 'back-lib-foundation/dist/app/addons/DatabaseAddOn' {
	import { IDatabaseConnector } from 'back-lib-persistence';
	import { IConfigurationProvider } from 'back-lib-foundation/dist/app/addons/ConfigurationProvider';
	export interface IDatabaseAddOn extends IServiceAddOn {
	}
	/**
	 * Initializes database connections.
	 */
	export class DatabaseAddOn implements IDatabaseAddOn {
	    	    	    constructor(_configProvider: IConfigurationProvider, _dbConnector: IDatabaseConnector);
	    /**
	     * @see IServiceAddOn.init
	     */
	    init(): Promise<void>;
	    /**
	     * @see IServiceAddOn.deadLetter
	     */
	    deadLetter(): Promise<void>;
	    /**
	     * @see IServiceAddOn.dispose
	     */
	    dispose(): Promise<void>;
	    	    	}

}
declare module 'back-lib-foundation/dist/app/addons/DirectRpcHandlerAddOnBase' {
	import { IDirectRpcHandler } from 'back-lib-service-communication';
	import { IConfigurationProvider } from 'back-lib-foundation/dist/app/addons/ConfigurationProvider';
	/**
	 * Base class for DirectRpcAddOn.
	 */
	export abstract class DirectRpcHandlerAddOnBase implements IServiceAddOn {
	    protected _configProvider: IConfigurationProvider;
	    protected _rpcHandler: IDirectRpcHandler;
	    constructor(_configProvider: IConfigurationProvider, _rpcHandler: IDirectRpcHandler);
	    /**
	     * @see IServiceAddOn.init
	     */
	    init(): Promise<void>;
	    /**
	     * @see IServiceAddOn.deadLetter
	     */
	    deadLetter(): Promise<void>;
	    /**
	     * @see IServiceAddOn.dispose
	     */
	    dispose(): Promise<void>;
	    protected handleRequests(): void;
	}

}
declare module 'back-lib-foundation/dist/app/addons/MediateRpcHandlerAddOnBase' {
	import { IMediateRpcHandler } from 'back-lib-service-communication';
	import { IConfigurationProvider } from 'back-lib-foundation/dist/app/addons/ConfigurationProvider';
	/**
	 * Base class for MediateRpcAddOn.
	 */
	export abstract class MediateRpcHandlerAddOnBase implements IServiceAddOn {
	    protected _configProvider: IConfigurationProvider;
	    protected _rpcHandler: IMediateRpcHandler;
	    protected abstract controllerIdentifier: string | symbol;
	    constructor(_configProvider: IConfigurationProvider, _rpcHandler: IMediateRpcHandler);
	    /**
	     * @see IServiceAddOn.init
	     */
	    init(): Promise<void>;
	    /**
	     * @see IServiceAddOn.deadLetter
	     */
	    deadLetter(): Promise<void>;
	    /**
	     * @see IServiceAddOn.dispose
	     */
	    dispose(): Promise<void>;
	    protected handleRequests(): void;
	}

}
declare module 'back-lib-foundation/dist/app/addons/MessageBrokerAddOn' {
	import { IMessageBrokerConnector } from 'back-lib-service-communication';
	import { IConfigurationProvider } from 'back-lib-foundation/dist/app/addons/ConfigurationProvider';
	export class MessageBrokerAddOn implements IServiceAddOn {
	    	    	    constructor(_configProvider: IConfigurationProvider, _msgBrokerCnn: IMessageBrokerConnector);
	    /**
	     * @see IServiceAddOn.init
	     */
	    init(): Promise<void>;
	    /**
	     * @see IServiceAddOn.deadLetter
	     */
	    deadLetter(): Promise<void>;
	    /**
	     * @see IServiceAddOn.dispose
	     */
	    dispose(): Promise<void>;
	}

}
declare module 'back-lib-foundation/dist/app/microservice/MicroServiceBase' {
	import * as cm from 'back-lib-common-util';
	import * as cfg from 'back-lib-foundation/dist/app/addons/ConfigurationProvider';
	import * as db from 'back-lib-foundation/dist/app/addons/DatabaseAddOn';
	import { MessageBrokerAddOn } from 'back-lib-foundation/dist/app/addons/MessageBrokerAddOn';
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
	export * from 'back-lib-foundation/dist/app/addons/ConfigurationProvider';
	export * from 'back-lib-foundation/dist/app/addons/DatabaseAddOn';
	export * from 'back-lib-foundation/dist/app/addons/DirectRpcHandlerAddOnBase';
	export * from 'back-lib-foundation/dist/app/addons/MediateRpcHandlerAddOnBase';
	export * from 'back-lib-foundation/dist/app/addons/MessageBrokerAddOn';
	export * from 'back-lib-foundation/dist/app/constants/Types';
	export * from 'back-lib-foundation/dist/app/microservice/MicroServiceBase';

}
