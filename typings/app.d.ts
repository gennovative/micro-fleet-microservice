/// <reference path="./globals.d.ts" />

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
	    static readonly MSG_BROKER_QUEUE: string;
	    static readonly MSG_BROKER_RECONN_TIMEOUT: string;
	    static readonly MSG_BROKER_USERNAME: string;
	    static readonly MSG_BROKER_PASSWORD: string;
	    static readonly SERVICE_NAME: string;
	}

}
declare module 'back-lib-foundation/src/app/adapters/MessageBrokerAdapter' {
	import * as amqp from 'amqplib';
	import { IConfigurationProvider } from 'back-lib-foundation/src/app/adapters/ConfigurationProvider';
	export type MessageHandleFunction = (msg: IMessage, ack?: () => void, nack?: () => void) => void;
	export type RpcHandleFunction = (msg: IMessage, reply: (response: any) => void, deny?: () => void) => void;
	export interface IMessage {
	    data: any;
	    raw: amqp.Message;
	    properties?: IPublishOptions;
	}
	export interface IPublishOptions {
	    contentType?: string;
	    contentEncoding?: string;
	    correlationId?: string;
	    replyTo?: string;
	}
	export interface IMessageBrokerAdapter extends IAdapter {
	    /**
	     * Sends `message` to the broker and label the message with `topic`.
	     * @param {string} topic - A name to label the message with. Should be in format "xxx.yyy.zzz".
	     * @param {string | Json | JsonArray} payload - A message to send to broker.
	     * @param {IPublishOptions} options - Options to add to message properties.
	     */
	    publish(topic: string, payload: string | Json | JsonArray, options?: IPublishOptions): Promise<void>;
	    /**
	     * Listens to messages whose label matches `matchingPattern`.
	     * @param {string} matchingPattern - Pattern to match with message label. Should be in format "xx.*" or "xx.#.#".
	     * @param {function} onMessage - Callback to invoke when there is an incomming message.
	     * @return {string} - A promise with resolve to a consumer tag, which is used to unsubscribe later.
	     */
	    subscribe(matchingPattern: string, onMessage: MessageHandleFunction, noAck?: boolean): Promise<string>;
	    /**
	     * Stop listening to a subscription that was made before.
	     */
	    unsubscribe(consumerTag: string): Promise<void>;
	    onError(handler: Function): void;
	}
	export class TopicMessageBrokerAdapter implements IMessageBrokerAdapter {
	    constructor(_configProvider: IConfigurationProvider);
	    init(): Promise<void>;
	    dispose(): Promise<void>;
	    subscribe(matchingPattern: string, onMessage: MessageHandleFunction, noAck?: boolean): Promise<string>;
	    publish(topic: string, payload: string | Json | JsonArray, options?: IPublishOptions): Promise<void>;
	    unsubscribe(consumerTag: string): Promise<void>;
	    onError(handler: Function): void;
	}

}
declare module 'back-lib-foundation/src/app/rpc/RpcCommon' {
	import { IDependencyContainer } from 'back-lib-common-util';
	export interface IRpcRequest extends Json {
	    from: string;
	    to: string;
	    params: any;
	}
	export interface IRpcResponse extends Json {
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
	    init(param?: any): void;
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
	export class HttpRpcCaller extends rpc.RpcCallerBase implements IDirectRpcCaller {
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
	    constructor(_configProvider: IConfigurationProvider);
	    clientName: string;
	    init(): Promise<void>;
	    dispose(): Promise<void>;
	}

}
declare module 'back-lib-foundation/src/app/rpc/DirectRpcHandler' {
	import { IDependencyContainer } from 'back-lib-common-util';
	import * as rpc from 'back-lib-foundation/src/app/rpc/RpcCommon';
	export interface IDirectRpcHandler extends rpc.IRpcHandler {
	}
	export class ExpressRpcHandler extends rpc.RpcHandlerBase implements IDirectRpcHandler {
	    constructor(depContainer: IDependencyContainer);
	    init(param?: any): void;
	    handle(action: string, dependencyIdentifier: string | symbol, actionFactory?: rpc.RpcActionFactory): void;
	}

}
declare module 'back-lib-foundation/src/app/rpc/MediateRpcCaller' {
	import { IMessageBrokerAdapter } from 'back-lib-foundation/src/app/adapters/MessageBrokerAdapter';
	import * as rpc from 'back-lib-foundation/src/app/rpc/RpcCommon';
	export interface IMediateRpcCaller extends rpc.IRpcCaller {
	}
	export class MessageBrokerRpcCaller extends rpc.RpcCallerBase implements IMediateRpcCaller {
	    constructor(_msgBrokerAdt: IMessageBrokerAdapter);
	    init(param: any): void;
	    call(moduleName: string, action: string, params: any): Promise<rpc.IRpcResponse>;
	}

}
declare module 'back-lib-foundation/src/app/rpc/MediateRpcHandler' {
	import { IDependencyContainer } from 'back-lib-common-util';
	import { IMessageBrokerAdapter } from 'back-lib-foundation/src/app/adapters/MessageBrokerAdapter';
	import * as rpc from 'back-lib-foundation/src/app/rpc/RpcCommon';
	export interface IMediateRpcHandler extends rpc.IRpcHandler {
	}
	export class MessageBrokerRpcHandler extends rpc.RpcHandlerBase implements IMediateRpcHandler {
	    constructor(depContainer: IDependencyContainer, _msgBrokerAdt: IMessageBrokerAdapter);
	    init(param?: any): void;
	    handle(action: string, dependencyIdentifier: string | symbol, actionFactory?: rpc.RpcActionFactory): void;
	}

}
declare module 'back-lib-foundation/src/app/microservice/MicroServiceBase' {
	import * as cm from 'back-lib-common-util';
	import * as cf from 'back-lib-foundation/src/app/adapters/ConfigurationProvider';
	import * as db from 'back-lib-foundation/src/app/adapters/DatabaseAdapter';
	import * as mb from 'back-lib-foundation/src/app/adapters/MessageBrokerAdapter';
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
	    protected addMessageBrokerAdapter(): mb.IMessageBrokerAdapter;
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
	export * from 'back-lib-foundation/src/app/adapters/ConfigurationProvider';
	export * from 'back-lib-foundation/src/app/adapters/DatabaseAdapter';
	export * from 'back-lib-foundation/src/app/adapters/MessageBrokerAdapter';
	export * from 'back-lib-foundation/src/app/constants/SettingKeys';
	export * from 'back-lib-foundation/src/app/constants/Types';
	export * from 'back-lib-foundation/src/app/microservice/MicroServiceBase';
	export * from 'back-lib-foundation/src/app/rpc/RpcCommon';
	export * from 'back-lib-foundation/src/app/rpc/DirectRpcCaller';
	export * from 'back-lib-foundation/src/app/rpc/DirectRpcHandler';
	export * from 'back-lib-foundation/src/app/rpc/MediateRpcCaller';
	export * from 'back-lib-foundation/src/app/rpc/MediateRpcHandler';

}
