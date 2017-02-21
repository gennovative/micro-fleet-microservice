declare module 'back-lib-gennova-foundation/src/app/adapters/IAdapter' {
	export interface IAdapter {
	    /**
	     * Initializes this adapter.
	     * @returns A promise that resolves `true` if success, rejects if otherwise.
	     */
	    init(): Promise<void>;
	    /**
	     * Stops this adapter and cleans all resources.
	     */
	    dispose(): Promise<void>;
	}

}
declare module 'back-lib-gennova-foundation/src/app/microservice/Exceptions' {
	export class Exception implements Error {
	    protected _message: string;
	    protected _isCritical: boolean;
	    private _name;
	    private _stack;
	    constructor(_message?: string, _isCritical?: boolean);
	    name: string;
	    stack: string;
	    readonly message: string;
	    readonly isCritical: boolean;
	    toString(): string;
	}
	export class CriticalException extends Exception {
	    constructor(message?: string);
	}
	export class MinorException extends Exception {
	    constructor(message?: string);
	}
	export class InvalidArgumentException extends Exception {
	    constructor(argName: string, message?: string);
	}

}
declare module 'back-lib-gennova-foundation/src/app/utils/Guard' {
	export class Guard {
	    private constructor();
	    static assertDefined(name: string, target: any): void;
	}

}
declare module 'back-lib-gennova-foundation/src/app/utils/DependencyContainer' {
	import { injectable, inject, interfaces } from 'inversify';
	export { injectable, inject };
	export class BindingScope<T> {
	    private _binding;
	    constructor(_binding: interfaces.BindingInWhenOnSyntax<T>);
	    asSingleton(): void;
	    asTransient(): void;
	}
	export class DependencyContainer {
	    private _container;
	    constructor();
	    bind<TInterface>(identifier: string | symbol, constructor: interfaces.Newable<TInterface>): BindingScope<TInterface>;
	    resolve<T>(identifier: string | symbol): T;
	    dispose(): void;
	    private assertNotDisposed();
	}

}
declare module 'back-lib-gennova-foundation/src/app/constants/SettingKeys' {
	export class SettingKeys {
	    static CONFIG_SERVICE_ADDRESSES: string;
	    static DB_HOST: string;
	    static DB_USER: string;
	    static DB_PASSWORD: string;
	    static DB_NAME: string;
	    static DB_FILE: string;
	    static DB_CONN_STRING: string;
	    static MSG_BROKER_HOST: string;
	    static MSG_BROKER_EXCHANGE: string;
	    static MSG_BROKER_RECONN_TIMEOUT: string;
	    static SERVICE_NAME: string;
	}

}
declare module 'back-lib-gennova-foundation/src/app/adapters/ConfigurationAdapter' {
	import { IAdapter } from 'back-lib-gennova-foundation/src/app/adapters/IAdapter';
	export interface IConfigurationAdapter extends IAdapter {
	    enableRemote: boolean;
	    get(key: string): string;
	    fetch(): Promise<boolean>;
	}
	/**
	 * Provides settings from package
	 */
	export class ConfigurationAdapter implements IConfigurationAdapter {
	    private _configFilePath;
	    private _fileSettings;
	    private _requestMaker;
	    private _remoteSettings;
	    private _enableRemote;
	    constructor();
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
	    private attemptFetch(address);
	}

}
declare module 'back-lib-gennova-foundation/src/app/constants/Types' {
	export class Types {
	    static CONFIG_ADAPTER: symbol;
	    static DB_ADAPTER: symbol;
	    static BROKER_ADAPTER: symbol;
	}

}
declare module 'back-lib-gennova-foundation/src/app/adapters/DatabaseAdapter' {
	import { IAdapter } from 'back-lib-gennova-foundation/src/app/adapters/IAdapter';
	import { IConfigurationAdapter } from 'back-lib-gennova-foundation/src/app/adapters/ConfigurationAdapter';
	export interface IDatabaseAdapter extends IAdapter {
	    clientName: string;
	    dispose(): Promise<void>;
	}
	/**
	 * Provides settings from package
	 */
	export class KnexDatabaseAdapter implements IDatabaseAdapter {
	    private _configAdapter;
	    private _clientName;
	    private _knex;
	    constructor(_configAdapter: IConfigurationAdapter);
	    clientName: string;
	    init(): Promise<void>;
	    dispose(): Promise<void>;
	    private buildConnSettings();
	}

}
declare module 'back-lib-gennova-foundation/src/app/adapters/MessageBrokerAdapter' {
	import { IAdapter } from 'back-lib-gennova-foundation/src/app/adapters/IAdapter';
	import { IConfigurationAdapter } from 'back-lib-gennova-foundation/src/app/adapters/ConfigurationAdapter';
	export interface IMessageBrokerAdapter extends IAdapter {
	}
	export class MessageBrokerAdapter implements IMessageBrokerAdapter {
	    private _configAdapter;
	    private _channel;
	    constructor(_configAdapter: IConfigurationAdapter);
	    init(): Promise<void>;
	    dispose(): Promise<void>;
	}

}
declare module 'back-lib-gennova-foundation/src/app/hubs/ExpressHub' {
	/// <reference types="node" />
	import * as core from 'express-serve-static-core';
	import * as http from 'http';
	export interface IMicroWeb {
	    name: string;
	    initRoute(router: core.IRouter): void;
	}
	/**
	 * A central point that allows micro web services to register their routes.
	 */
	export class ExpressHub {
	    private _app;
	    constructor();
	    /**
	     * Registers a micro web to serve under path "/{web name}/{web routes}".
	     */
	    use(microWeb: IMicroWeb): ExpressHub;
	    /**
	     * Starts HTTP server.
	     */
	    listen(port?: number, callback?: Function): http.Server;
	}

}
declare module 'back-lib-gennova-foundation/src/app/microservice/EntityBase' {
	import { Model } from 'objection';
	export abstract class EntityBase extends Model {
	    static readonly tableName: string;
	    id: number;
	}

}
declare module 'back-lib-gennova-foundation/src/app/microservice/MicroServiceBase' {
	import { IAdapter } from 'back-lib-gennova-foundation/src/app/adapters/IAdapter';
	import { IConfigurationAdapter } from 'back-lib-gennova-foundation/src/app/adapters/ConfigurationAdapter';
	import { IDatabaseAdapter } from 'back-lib-gennova-foundation/src/app/adapters/DatabaseAdapter';
	import { DependencyContainer } from 'back-lib-gennova-foundation/src/app/utils/DependencyContainer';
	export abstract class MicroServiceBase {
	    protected _configAdapter: IConfigurationAdapter;
	    protected _depContainer: DependencyContainer;
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
	    protected addDbAdapter(): IDatabaseAdapter;
	    protected addConfigAdapter(): IConfigurationAdapter;
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
	    private initAdapters();
	    private disposeAdapters();
	    private exitProcess();
	    /**
	     * Gracefully shutdown the application when user presses Ctrl-C in Console/Terminal,
	     * or when the OS is trying to stop the service process.
	     *
	     */
	    private handleGracefulShutdown();
	}

}
declare module 'back-lib-gennova-foundation/src/app/microservice/RepositoryBase' {
	import { QueryBuilder } from 'objection';
	import { EntityBase } from 'back-lib-gennova-foundation/src/app/microservice/EntityBase';
	export abstract class RepositoryBase<TEntity extends EntityBase> {
	    create(ent: TEntity): Promise<TEntity>;
	    delete(id: number): Promise<number>;
	    find(id: number): Promise<TEntity>;
	    patch(entity: Partial<TEntity>): Promise<number>;
	    update(entity: TEntity): Promise<number>;
	    abstract query(): QueryBuilder<TEntity>;
	}

}
declare module 'back-lib-gennova-foundation' {
	import 'reflect-metadata';
	export * from 'back-lib-gennova-foundation/src/app/adapters/IAdapter';
	export * from 'back-lib-gennova-foundation/src/app/adapters/ConfigurationAdapter';
	export * from 'back-lib-gennova-foundation/src/app/adapters/DatabaseAdapter';
	export * from 'back-lib-gennova-foundation/src/app/adapters/MessageBrokerAdapter';
	export * from 'back-lib-gennova-foundation/src/app/hubs/ExpressHub';
	export * from 'back-lib-gennova-foundation/src/app/microservice/EntityBase';
	export * from 'back-lib-gennova-foundation/src/app/microservice/Exceptions';
	export * from 'back-lib-gennova-foundation/src/app/microservice/MicroServiceBase';
	export * from 'back-lib-gennova-foundation/src/app/microservice/RepositoryBase';
	export * from 'back-lib-gennova-foundation/src/app/utils/DependencyContainer';
	export * from 'back-lib-gennova-foundation/src/app/utils/Guard';
	export * from 'back-lib-gennova-foundation/src/app/constants/SettingKeys';
	export * from 'back-lib-gennova-foundation/src/app/constants/Types';

}
