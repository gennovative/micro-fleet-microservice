/// <reference path="./globals.d.ts" />

declare module 'back-lib-foundation/src/app/microservice/Exceptions' {
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
declare module 'back-lib-foundation/src/app/utils/Guard' {
	export class Guard {
	    private constructor();
	    static assertDefined(name: string, target: any): void;
	    static assertNotEmpty(name: string, target: any): void;
	    static assertIsFunction(name: string, target: any): void;
	    static assertIsTruthy(target: any, message: string, isCritical?: boolean): void;
	    static assertIsFalsey(target: any, message: string, isCritical?: boolean): void;
	    static assertIsMatch(name: string, rule: RegExp, target: string, message?: string): void;
	}

}
declare module 'back-lib-foundation/src/app/utils/DependencyContainer' {
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
declare module 'back-lib-foundation/src/app/constants/Types' {
	export class Types {
	    static readonly MODEL_MAPPER: symbol;
	    static readonly BROKER_ADAPTER: symbol;
	    static readonly CONFIG_PROVIDER: symbol;
	    static readonly DB_ADAPTER: symbol;
	    static readonly DEPENDENCY_CONTAINER: symbol;
	    static readonly DIRECT_RPC_CALLER: symbol;
	    static readonly DIRECT_RPC_HANDLER: symbol;
	    static readonly MEDIATE_RPC_CALLER: symbol;
	    static readonly MEDIATE_RPC_HANDLER: symbol;
	}

}
declare module 'back-lib-foundation/src/app/constants/SettingKeys' {
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
	    static readonly MSG_BROKER_RECONN_TIMEOUT: string;
	    static readonly SERVICE_NAME: string;
	}

}
declare module 'back-lib-foundation/src/app/adapters/MessageBrokerAdapter' {
	import * as amqp from 'amqplib';
	import { IConfigurationProvider } from 'back-lib-foundation/src/app/adapters/ConfigurationProvider';
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
	    constructor(_configAdapter: IConfigurationProvider);
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
declare module 'back-lib-foundation/src/app/rpc/RpcCommon' {
	import { IDependencyContainer } from 'back-lib-foundation/src/app/utils/DependencyContainer';
	export interface IRpcRequest {
	    from: string;
	    to: string;
	    params: any;
	}
	export interface IRpcResponse {
	    isSuccess: boolean;
	    from: string;
	    to: string;
	    data: any;
	}
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
	    call(moduleName: string, action: string, params: any): Promise<IRpcResponse>;
	    /**
	     * Sets up this RPC caller with specified `param`. Each implementation class requires
	     * different kinds of `param`.
	     */
	    init(param: any): any;
	}
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
	    /**
	     * Sets up this RPC handler with specified `param`. Each implementation class requires
	     * different kinds of `param`.
	     */
	    init(param: any): void;
	}
	export abstract class RpcCallerBase {
	    protected _name: string;
	    name: string;
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
declare module 'back-lib-foundation/src/app/rpc/DirectRpcCaller' {
	import * as rpc from 'back-lib-foundation/src/app/rpc/RpcCommon';
	export interface IDirectRpcCaller extends rpc.IRpcCaller {
	    /**
	     * IP address or host name including port number.
	     * Do not include protocol (http, ftp...) because different class implementations
	     * will prepend different protocols.
	     */
	    baseAddress: string;
	}
	export class DirectRpcCaller extends rpc.RpcCallerBase implements IDirectRpcCaller {
	    private _baseAddress;
	    private _requestMaker;
	    constructor();
	    baseAddress: string;
	    init(param: any): void;
	    call(moduleName: string, action: string, params: any): Promise<rpc.IRpcResponse>;
	}

}
declare module 'back-lib-foundation/src/app/adapters/ConfigurationProvider' {
	import * as rdc from 'back-lib-foundation/src/app/rpc/DirectRpcCaller';
	export interface IConfigurationProvider extends IAdapter {
	    enableRemote: boolean;
	    get(key: string): string;
	    fetch(): Promise<boolean>;
	}
	/**
	 * Provides settings from package
	 */
	export class ConfigurationProvider implements IConfigurationProvider {
	    private _rpcCaller;
	    private _configFilePath;
	    private _fileSettings;
	    private _requestMaker;
	    private _remoteSettings;
	    private _enableRemote;
	    constructor(_rpcCaller: rdc.IDirectRpcCaller);
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
declare module 'back-lib-foundation/src/app/adapters/DatabaseAdapter' {
	import { IConfigurationProvider } from 'back-lib-foundation/src/app/adapters/ConfigurationProvider';
	/**
	 * Db driver names for `IDatabaseAdapter.clientName` property.
	 */
	export class DbClient {
	    /**
	     * Microsoft SQL Server
	     */
	    static readonly MSSQL: string;
	    /**
	     * MySQL
	     */
	    static readonly MYSQL: string;
	    /**
	     * PostgreSQL
	     */
	    static readonly POSTGRESQL: string;
	    /**
	     * SQLite 3
	     */
	    static readonly SQLITE3: string;
	}
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
	    constructor(_configAdapter: IConfigurationProvider);
	    clientName: string;
	    init(): Promise<void>;
	    dispose(): Promise<void>;
	    private buildConnSettings();
	}

}
declare module 'back-lib-foundation/src/app/hubs/ExpressHub' {
	/// <reference types="express" />
	/// <reference types="node" />
	import * as http from 'http';
	import * as express from 'express';
	export interface IMicroWeb {
	    name: string;
	    initRoute(router: express.Router): void;
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
declare module 'back-lib-foundation/src/app/rpc/DirectRpcHandler' {
	import { IDependencyContainer } from 'back-lib-foundation/src/app/utils/DependencyContainer';
	import * as rpc from 'back-lib-foundation/src/app/rpc/RpcCommon';
	export interface IDirectRpcHandler extends rpc.IRpcHandler {
	}
	export class ExpressDirectRpcHandler extends rpc.RpcHandlerBase implements IDirectRpcHandler {
	    private static URL_TESTER;
	    private _app;
	    private _router;
	    constructor(depContainer: IDependencyContainer);
	    init(param: any): void;
	    handle(action: string, dependencyIdentifier: string | symbol, actionFactory?: rpc.RpcActionFactory): void;
	    private buildHandleFunc(actionFn);
	}

}
declare module 'back-lib-foundation/src/app/rpc/MediateRpcCaller' {
	import { IMessageBrokerAdapter } from 'back-lib-foundation/src/app/adapters/MessageBrokerAdapter';
	import * as rpc from 'back-lib-foundation/src/app/rpc/RpcCommon';
	export interface IMediateRpcCaller extends rpc.IRpcCaller {
	}
	export class MessageBrokerRpcCaller extends rpc.RpcCallerBase implements IMediateRpcCaller {
	    private _msgBrokerAdt;
	    constructor(_msgBrokerAdt: IMessageBrokerAdapter);
	    init(param: any): void;
	    call(moduleName: string, action: string, params: any): Promise<rpc.IRpcResponse>;
	}

}
declare module 'back-lib-foundation/src/app/rpc/MediateRpcHandler' {
	import { IDependencyContainer } from 'back-lib-foundation/src/app/utils/DependencyContainer';
	import { IMessageBrokerAdapter } from 'back-lib-foundation/src/app/adapters/MessageBrokerAdapter';
	import * as rpc from 'back-lib-foundation/src/app/rpc/RpcCommon';
	export interface IMediateRpcHandler extends rpc.IRpcHandler {
	}
	export class MessageBrokerRpcHandler extends rpc.RpcHandlerBase implements IMediateRpcHandler {
	    private _msgBrokerAdt;
	    constructor(depContainer: IDependencyContainer, _msgBrokerAdt: IMessageBrokerAdapter);
	    init(param: any): void;
	    handle(action: string, dependencyIdentifier: string | symbol, actionFactory?: rpc.RpcActionFactory): void;
	    private buildHandleFunc(actionFn);
	}

}
declare module 'back-lib-foundation/src/app/microservice/MicroServiceBase' {
	import * as cf from 'back-lib-foundation/src/app/adapters/ConfigurationProvider';
	import * as db from 'back-lib-foundation/src/app/adapters/DatabaseAdapter';
	import * as mb from 'back-lib-foundation/src/app/adapters/MessageBrokerAdapter';
	import * as dep from 'back-lib-foundation/src/app/utils/DependencyContainer';
	export abstract class MicroServiceBase {
	    protected _configAdapter: cf.IConfigurationProvider;
	    protected _depContainer: dep.IDependencyContainer;
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
	    protected addMessageBrokerAdapter(): mb.IMessageBrokerAdapter;
	    protected registerDbAdapter(): void;
	    protected registerConfigProvider(): void;
	    protected registerDirectRpcCaller(): void;
	    protected registerDirectRpcHandler(): void;
	    protected registerMessageBrokerAdapter(): void;
	    protected registerMediateRpcCaller(): void;
	    protected registerMediateRpcHandler(): void;
	    protected registerModelMapper(): AutoMapper;
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
declare module 'back-lib-foundation/src/app/persistence/EntityBase' {
	import { Model } from 'objection';
	export abstract class EntityBase extends Model {
	    static readonly tableName: string;
	    id: number;
	}

}
declare module 'back-lib-foundation/src/app/persistence/RepositoryBase' {
	import { QueryBuilder } from 'objection';
	import { EntityBase } from 'back-lib-foundation/src/app/persistence/EntityBase';
	export interface IRepository<TModel extends IModelDTO> {
	    countAll(): Promise<number>;
	    create(model: TModel): Promise<TModel>;
	    delete(id: number): Promise<number>;
	    find(id: number): Promise<TModel>;
	    page(pageIndex: number, pageSize: number): Promise<TModel[]>;
	    patch(model: Partial<TModel>): Promise<number>;
	    update(model: TModel): Promise<number>;
	}
	export abstract class RepositoryBase<TEntity extends EntityBase, TModel extends IModelDTO> implements IRepository<TModel> {
	    protected _modelMapper: AutoMapper;
	    constructor(_modelMapper: AutoMapper);
	    countAll(): Promise<number>;
	    create(model: TModel): Promise<TModel>;
	    delete(id: number): Promise<number>;
	    find(id: number): Promise<TModel>;
	    patch(model: Partial<TModel>): Promise<number>;
	    page(pageIndex: number, pageSize: number): Promise<TModel[]>;
	    update(model: TModel): Promise<number>;
	    protected abstract query(): QueryBuilder<TEntity>;
	    protected abstract createModelMap(): void;
	    protected abstract toEntity(from: TModel | TModel[]): TEntity & TEntity[];
	    protected abstract toDTO(from: TEntity | TEntity[]): TModel & TModel[];
	}

}
declare module 'back-lib-foundation' {
	import 'reflect-metadata';
	import 'automapper-ts';
	export * from 'back-lib-foundation/src/app/adapters/ConfigurationProvider';
	export * from 'back-lib-foundation/src/app/adapters/DatabaseAdapter';
	export * from 'back-lib-foundation/src/app/adapters/MessageBrokerAdapter';
	export * from 'back-lib-foundation/src/app/constants/SettingKeys';
	export * from 'back-lib-foundation/src/app/constants/Types';
	export * from 'back-lib-foundation/src/app/hubs/ExpressHub';
	export * from 'back-lib-foundation/src/app/microservice/Exceptions';
	export * from 'back-lib-foundation/src/app/microservice/MicroServiceBase';
	export * from 'back-lib-foundation/src/app/persistence/EntityBase';
	export * from 'back-lib-foundation/src/app/persistence/RepositoryBase';
	export * from 'back-lib-foundation/src/app/rpc/RpcCommon';
	export * from 'back-lib-foundation/src/app/rpc/DirectRpcCaller';
	export * from 'back-lib-foundation/src/app/rpc/DirectRpcHandler';
	export * from 'back-lib-foundation/src/app/rpc/MediateRpcCaller';
	export * from 'back-lib-foundation/src/app/rpc/MediateRpcHandler';
	export * from 'back-lib-foundation/src/app/utils/DependencyContainer';
	export * from 'back-lib-foundation/src/app/utils/Guard';

}
