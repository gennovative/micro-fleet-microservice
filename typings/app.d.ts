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
	    static assertNotEmpty(name: string, target: any): void;
	    static assertIsFunction(name: string, target: any): void;
	    static assertIsTruthy(target: any, message: string, isCritical?: boolean): void;
	    static assertIsMatch(name: string, rule: RegExp, target: string, message?: string): void;
	}

}
declare module 'back-lib-gennova-foundation/src/app/utils/DependencyContainer' {
	import { injectable, inject, interfaces } from 'inversify';
	export class BindingScope<T> {
	    private _binding;
	    constructor(_binding: interfaces.BindingInWhenOnSyntax<T>);
	    asSingleton(): void;
	    asTransient(): void;
	}
	export { injectable, inject };
	export interface INewable<T> extends interfaces.Newable<T> {
	}
	export interface IDependencyContainer {
	    /**
	     * Registers `constructor` as resolvable with key `identifier`.
	     * @param {string | symbol} identifier - The key used to resolve this dependency.
	     * @param {INewable<T>} constructor - A class that will be resolved with `identifier`.
	     *
	     * @return {BindingScope} - A BindingScope instance that allows settings dependency as singleton or transient.
	     */
	    bind<TInterface>(identifier: string | symbol, constructor: INewable<TInterface>): BindingScope<TInterface>;
	    /**
	     * Registers a constant value with key `identifier`.
	     * @param {string | symbol} identifier - The key used to resolve this dependency.
	     * @param {T} value - The constant value to store.
	     */
	    bindConstant<T>(identifier: string | symbol, value: T): any;
	    /**
	     * Retrieves an instance of dependency with all its own dependencies resolved.
	     * @param {string | Symbol} - The key that was used to register before.
	     *
	     * @return {T} - An instance of registered type, or null if that type was not registered.
	     */
	    resolve<T>(identifier: string | symbol): T;
	    /**
	     * Gets rid of all registered dependencies.
	     */
	    dispose(): void;
	}
	export class DependencyContainer {
	    private _container;
	    constructor();
	    bind<TInterface>(identifier: string | symbol, constructor: INewable<TInterface>): BindingScope<TInterface>;
	    bindConstant<T>(identifier: string | symbol, value: T): void;
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
	    static BROKER_ADAPTER: symbol;
	    static CONFIG_ADAPTER: symbol;
	    static DB_ADAPTER: symbol;
	    static DEPENDENCY_CONTAINER: symbol;
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
	import * as amqp from 'amqplib';
	import { IAdapter } from 'back-lib-gennova-foundation/src/app/adapters/IAdapter';
	import { IConfigurationAdapter } from 'back-lib-gennova-foundation/src/app/adapters/ConfigurationAdapter';
	export type MessageHandleFunction = (msg: IMessage, ack: () => void, nack?: () => void) => void;
	export type RpcHandleFunction = (msg: IMessage, reply: (response: any) => void, deny?: () => void) => void;
	export interface IMessage {
	    data: any;
	    raw: amqp.Message;
	    properties?: any;
	}
	export interface IPublishOptions extends amqp.Options.Publish {
	}
	export interface IMessageBrokerAdapter extends IAdapter {
	    /**
	     * Sends `message` to the broker and label the message with `topic`.
	     * @param {string} topic - A name to label the message with. Should be in format "xxx.yyy.zzz".
	     * @param {any} message - A message to send to broker.
	     * @param {IPublishOptions} options - Options to add to message properties.
	     */
	    publish(topic: string, message: any, options?: IPublishOptions): Promise<void>;
	    /**
	     * Listens to messages whose label matches `matchingPattern`.
	     * @param {string} matchingPattern - Pattern to match with message label. Should be in format "xx.*" or "xx.#.#".
	     * @param {function} onMessage - Callback to invoke when there is an incomming message.
	     * @return {string} - A promise with resolve to a consumer tag, which is used to unsubscribe later.
	     */
	    subscribe(matchingPattern: string, onMessage: MessageHandleFunction): Promise<string>;
	    /**
	     * Stop listening to a subscription that was made before.
	     */
	    unsubscribe(consumerTag: string): Promise<void>;
	}
	export class TopicMessageBrokerAdapter implements IMessageBrokerAdapter {
	    private _configAdapter;
	    private _connectionPrm;
	    private _publishChanPrm;
	    private _consumeChanPrm;
	    private _exchange;
	    private _subscriptions;
	    constructor(_configAdapter: IConfigurationAdapter);
	    init(): Promise<void>;
	    dispose(): Promise<void>;
	    subscribe(matchingPattern: string, onMessage: MessageHandleFunction, noAck?: boolean): Promise<string>;
	    publish(topic: string, message: any, options?: IPublishOptions): Promise<void>;
	    unsubscribe(consumerTag: string): Promise<void>;
	    private connect(hostAddress);
	    private disconnect();
	    private createChannel();
	    /**
	     * If `queueName` is null, creates a queue and binds it to `matchingPattern`.
	     * If `queueName` is not null, binds `matchingPattern` to the queue with that name.
	     * @return {string} null if no queue is created, otherwise returns the new queue name.
	     */
	    private bindQueue(channelPromise, matchingPattern);
	    private unbindQueue(channelPromise, matchingPattern);
	    private handleError(err, message);
	    private moreSub(matchingPattern, consumerTag);
	    /**
	     * @return {string} the pattern name which should be unbound, othewise return null.
	     */
	    private lessSub(consumerTag);
	    private parseMessage(raw);
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
	export interface IRepository<TEntity extends EntityBase> {
	    create(ent: TEntity): Promise<TEntity>;
	    delete(id: number): Promise<number>;
	    find(id: number): Promise<TEntity>;
	    patch(entity: Partial<TEntity>): Promise<number>;
	    update(entity: TEntity): Promise<number>;
	    query(): QueryBuilder<TEntity>;
	}
	export abstract class RepositoryBase<TEntity extends EntityBase> implements IRepository<TEntity> {
	    create(ent: TEntity): Promise<TEntity>;
	    delete(id: number): Promise<number>;
	    find(id: number): Promise<TEntity>;
	    patch(entity: Partial<TEntity>): Promise<number>;
	    update(entity: TEntity): Promise<number>;
	    abstract query(): QueryBuilder<TEntity>;
	}

}
declare module 'back-lib-gennova-foundation/src/app/rpc/RpcModels' {
	export interface IRpcRequest {
	    from: string;
	    to: string;
	    param: any;
	}
	export interface IRpcResponse {
	    isSuccess: boolean;
	    from: string;
	    to: string;
	    data: any;
	}

}
declare module 'back-lib-gennova-foundation/src/app/rpc/RpcCallerBase' {
	import { IRpcResponse } from 'back-lib-gennova-foundation/src/app/rpc/RpcModels';
	export interface IRpcCaller {
	    /**
	     * A name used in "from" and "to" request property.
	     */
	    name: string;
	    /**
	     * Listens to `route`, resolves an instance with `dependencyIdentifier`
	     * when there is a request coming, calls instance's `action` method. If `actions`
	     * is not specified, RPC Caller tries to figure out an action method from `route`.
	     */
	    call(moduleName: string, action: string, param: any): Promise<IRpcResponse>;
	}
	export abstract class RpcCallerBase {
	    protected _name: string;
	    name: string;
	}

}
declare module 'back-lib-gennova-foundation/src/app/rpc/RpcHandlerBase' {
	import { IDependencyContainer } from 'back-lib-gennova-foundation/src/app/utils/DependencyContainer';
	import { IRpcRequest, IRpcResponse } from 'back-lib-gennova-foundation/src/app/rpc/RpcModels';
	export type PromiseResolveFn = (value?: any | PromiseLike<any>) => void;
	export type PromiseRejectFn = (reason?: any) => void;
	export type RpcControllerFunction = (request: IRpcRequest, resolve: PromiseResolveFn, reject: PromiseRejectFn) => void;
	export type RpcActionFactory = (controller) => RpcControllerFunction;
	export interface IRpcHandler {
	    /**
	     * A name used in "from" and "to" request property.
	     */
	    name: string;
	    /**
	     * Waits for incoming request, resolves an instance with `dependencyIdentifier`,
	     * calls instance's `action` method. If `customAction` is specified,
	     * calls instance's `customAction` instead.
	     */
	    handle(action: string, dependencyIdentifier: string | symbol, actionFactory?: RpcActionFactory): any;
	}
	export abstract class RpcHandlerBase {
	    protected _depContainer: IDependencyContainer;
	    protected _name: string;
	    name: string;
	    constructor(_depContainer: IDependencyContainer);
	    protected resolveActionFunc(action: string, depId: string | symbol, actFactory?: RpcActionFactory): RpcControllerFunction;
	    protected createResponse(isSuccess: any, data: any, replyTo: string): IRpcResponse;
	}

}
declare module 'back-lib-gennova-foundation/src/app/rpc/HttpRpcCaller' {
	import { RpcCallerBase, IRpcCaller } from 'back-lib-gennova-foundation/src/app/rpc/RpcCallerBase';
	import { IRpcResponse } from 'back-lib-gennova-foundation/src/app/rpc/RpcModels';
	export interface IHttpRpcCaller extends IRpcCaller {
	    baseUrl: string;
	}
	export class HttpRpcCaller extends RpcCallerBase implements IHttpRpcCaller {
	    private _baseUrl;
	    private _requestMaker;
	    constructor();
	    baseUrl: string;
	    call(moduleName: string, action: string, param: any): Promise<IRpcResponse>;
	}

}
declare module 'back-lib-gennova-foundation/src/app/rpc/HttpRpcHandler' {
	import * as express from 'express-serve-static-core';
	import { IDependencyContainer } from 'back-lib-gennova-foundation/src/app/utils/DependencyContainer';
	import { RpcHandlerBase, IRpcHandler, RpcActionFactory } from 'back-lib-gennova-foundation/src/app/rpc/RpcHandlerBase';
	export interface IHttpRpcHandler extends IRpcHandler {
	    router: express.IRouter;
	}
	export class ExpressRpcHandler extends RpcHandlerBase implements IHttpRpcHandler {
	    private readonly _urlSafe;
	    private _router;
	    router: express.IRouter;
	    constructor(depContainer: IDependencyContainer);
	    handle(action: string, dependencyIdentifier: string | symbol, actionFactory?: RpcActionFactory): void;
	    private buildHandleFunc(actionFn);
	}

}
declare module 'back-lib-gennova-foundation/src/app/rpc/MessageBrokerRpcCaller' {
	import { IMessageBrokerAdapter } from 'back-lib-gennova-foundation/src/app/adapters/MessageBrokerAdapter';
	import { RpcCallerBase, IRpcCaller } from 'back-lib-gennova-foundation/src/app/rpc/RpcCallerBase';
	import { IRpcResponse } from 'back-lib-gennova-foundation/src/app/rpc/RpcModels';
	export class MessageBrokerRpcCaller extends RpcCallerBase implements IRpcCaller {
	    private _msgBrokerAdt;
	    constructor(_msgBrokerAdt: IMessageBrokerAdapter);
	    call(moduleName: string, action: string, param: any): Promise<IRpcResponse>;
	}

}
declare module 'back-lib-gennova-foundation/src/app/rpc/MessageBrokerRpcHandler' {
	import { IDependencyContainer } from 'back-lib-gennova-foundation/src/app/utils/DependencyContainer';
	import { IMessageBrokerAdapter } from 'back-lib-gennova-foundation/src/app/adapters/MessageBrokerAdapter';
	import { RpcHandlerBase, IRpcHandler, RpcActionFactory } from 'back-lib-gennova-foundation/src/app/rpc/RpcHandlerBase';
	export class MessageBrokerRpcHandler extends RpcHandlerBase implements IRpcHandler {
	    private _msgBrokerAdt;
	    constructor(depContainer: IDependencyContainer, _msgBrokerAdt: IMessageBrokerAdapter);
	    handle(action: string, dependencyIdentifier: string | symbol, actionFactory?: RpcActionFactory): void;
	    private buildHandleFunc(actionFn);
	}

}
declare module 'back-lib-gennova-foundation' {
	import 'reflect-metadata';
	export * from 'back-lib-gennova-foundation/src/app/adapters/IAdapter';
	export * from 'back-lib-gennova-foundation/src/app/adapters/ConfigurationAdapter';
	export * from 'back-lib-gennova-foundation/src/app/adapters/DatabaseAdapter';
	export * from 'back-lib-gennova-foundation/src/app/adapters/MessageBrokerAdapter';
	export * from 'back-lib-gennova-foundation/src/app/constants/SettingKeys';
	export * from 'back-lib-gennova-foundation/src/app/constants/Types';
	export * from 'back-lib-gennova-foundation/src/app/hubs/ExpressHub';
	export * from 'back-lib-gennova-foundation/src/app/microservice/EntityBase';
	export * from 'back-lib-gennova-foundation/src/app/microservice/Exceptions';
	export * from 'back-lib-gennova-foundation/src/app/microservice/MicroServiceBase';
	export * from 'back-lib-gennova-foundation/src/app/microservice/RepositoryBase';
	export * from 'back-lib-gennova-foundation/src/app/rpc/RpcCallerBase';
	export * from 'back-lib-gennova-foundation/src/app/rpc/RpcHandlerBase';
	export * from 'back-lib-gennova-foundation/src/app/rpc/RpcModels';
	export * from 'back-lib-gennova-foundation/src/app/rpc/HttpRpcCaller';
	export * from 'back-lib-gennova-foundation/src/app/rpc/HttpRpcHandler';
	export * from 'back-lib-gennova-foundation/src/app/rpc/MessageBrokerRpcCaller';
	export * from 'back-lib-gennova-foundation/src/app/rpc/MessageBrokerRpcHandler';
	export * from 'back-lib-gennova-foundation/src/app/utils/DependencyContainer';
	export * from 'back-lib-gennova-foundation/src/app/utils/Guard';

}
