/// <reference path="./global.d.ts" />

declare module 'back-lib-foundation/dist/app/addons/ConfigurationProvider' {
	import { SettingItemDataType, IConfigurationProvider } from 'back-lib-common-contracts';
	import { IDirectRpcCaller } from 'back-lib-service-communication';
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
	    get(key: string, dataType?: SettingItemDataType): number & boolean & string;
	    /**
	     * @see IConfigurationProvider.fetch
	     */
	    fetch(): Promise<boolean>;
	    onUpdate(listener: (changedKeys: string[]) => void): void;
	    	    	    	    	    	    	    	    	}

}
declare module 'back-lib-foundation/dist/app/constants/Types' {
	export class Types {
	    static readonly TRAILS_ADDON: symbol;
	    static readonly TRAILS_APP: symbol;
	}

}
declare module 'back-lib-foundation/dist/app/addons/TrailsServerAddOn' {
	import TrailsApp = require('trails');
	import { IDependencyContainer } from 'back-lib-common-util';
	export class TrailsServerAddOn implements IServiceAddOn {
	    	    constructor(depContainer: IDependencyContainer);
	    readonly server: TrailsApp;
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
declare module 'back-lib-foundation/dist/app/controllers/InternalControllerBase' {
	import { ISoftDelRepository, JoiModelValidator, ModelAutoMapper } from 'back-lib-common-contracts';
	import { IRpcRequest } from 'back-lib-service-communication';
	export abstract class InternalControllerBase<TModel extends IModelDTO> {
	    protected _ClassDTO: Newable;
	    protected _repo: ISoftDelRepository<TModel, any, any>;
	    constructor(_ClassDTO?: Newable, _repo?: ISoftDelRepository<TModel, any, any>);
	    protected readonly validator: JoiModelValidator<TModel>;
	    protected readonly translator: ModelAutoMapper<TModel>;
	    countAll(payload: any, resolve: PromiseResolveFn, reject: PromiseRejectFn, request: IRpcRequest): Promise<void>;
	    create(payload: any, resolve: PromiseResolveFn, reject: PromiseRejectFn, request: IRpcRequest): Promise<void>;
	    deleteHard(payload: any, resolve: PromiseResolveFn, reject: PromiseRejectFn, request: IRpcRequest): Promise<void>;
	    deleteSoft(payload: any, resolve: PromiseResolveFn, reject: PromiseRejectFn, request: IRpcRequest): Promise<void>;
	    exists(payload: any, resolve: PromiseResolveFn, reject: PromiseRejectFn, request: IRpcRequest): Promise<void>;
	    findByPk(payload: any, resolve: PromiseResolveFn, reject: PromiseRejectFn, request: IRpcRequest): Promise<void>;
	    recover(payload: any, resolve: PromiseResolveFn, reject: PromiseRejectFn, request: IRpcRequest): Promise<void>;
	    page(payload: any, resolve: PromiseResolveFn, reject: PromiseRejectFn, request: IRpcRequest): Promise<void>;
	    patch(payload: any, resolve: PromiseResolveFn, reject: PromiseRejectFn, request: IRpcRequest): Promise<void>;
	    update(payload: any, resolve: PromiseResolveFn, reject: PromiseRejectFn, request: IRpcRequest): Promise<void>;
	}

}
declare module 'back-lib-foundation/dist/app/controllers/RestControllerBase' {
	import * as express from 'express';
	import TrailsApp = require('trails');
	import TrailsController = require('trails-controller');
	import { ISoftDelRepository, ModelAutoMapper, JoiModelValidator } from 'back-lib-common-contracts';
	import { IdProvider } from 'back-lib-id-generator';
	export abstract class RestControllerBase<TModel extends IModelDTO> extends TrailsController {
	    protected _ClassDTO: {
	        new (): TModel;
	    };
	    protected _repo: ISoftDelRepository<TModel, any, any>;
	    protected _idProvider: IdProvider;
	    constructor(trailsApp: TrailsApp, _ClassDTO?: {
	        new (): TModel;
	    }, _repo?: ISoftDelRepository<TModel, any, any>, _idProvider?: IdProvider);
	    protected readonly validator: JoiModelValidator<TModel>;
	    protected readonly translator: ModelAutoMapper<TModel>;
	    countAll(req: express.Request, res: express.Response): Promise<void>;
	    create(req: express.Request, res: express.Response): Promise<void>;
	    deleteHard(req: express.Request, res: express.Response): Promise<void>;
	    deleteSoft(req: express.Request, res: express.Response): Promise<void>;
	    exists(req: express.Request, res: express.Response): Promise<void>;
	    findByPk(req: express.Request, res: express.Response): Promise<void>;
	    recover(req: express.Request, res: express.Response): Promise<void>;
	    page(req: express.Request, res: express.Response): Promise<void>;
	    patch(req: express.Request, res: express.Response): Promise<void>;
	    update(req: express.Request, res: express.Response): Promise<void>;
	    protected validationError(err: any, res: express.Response): void;
	    protected internalError(err: any, res: express.Response): void;
	    protected reply(result: any, res: express.Response): void;
	}

}
declare module 'back-lib-foundation/dist/app/microservice/MicroServiceBase' {
	import { IConfigurationProvider } from 'back-lib-common-contracts';
	import * as cm from 'back-lib-common-util';
	import * as per from 'back-lib-persistence';
	import * as com from 'back-lib-service-communication';
	import { IdProvider } from 'back-lib-id-generator';
	export abstract class MicroServiceBase {
	    protected _configProvider: IConfigurationProvider;
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
	    protected attachDbAddOn(): per.DatabaseAddOn;
	    protected attachConfigProvider(): IConfigurationProvider;
	    protected attachIdProvider(): IdProvider;
	    protected attachMessageBrokerAddOn(): com.MessageBrokerAddOn;
	    protected attachTrailsAddOn(): void;
	    protected registerDbAddOn(): void;
	    protected registerConfigProvider(): void;
	    protected registerIdProvider(): void;
	    protected registerDirectRpcCaller(): void;
	    protected registerDirectRpcHandler(): void;
	    protected registerMessageBrokerAddOn(): void;
	    protected registerMediateRpcCaller(): void;
	    protected registerMediateRpcHandler(): void;
	    protected registerTrailsAddOn(): void;
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
	export * from 'back-lib-foundation/dist/app/addons/TrailsServerAddOn';
	export * from 'back-lib-foundation/dist/app/constants/Types';
	export * from 'back-lib-foundation/dist/app/controllers/InternalControllerBase';
	export * from 'back-lib-foundation/dist/app/controllers/RestControllerBase';
	export * from 'back-lib-foundation/dist/app/microservice/MicroServiceBase';

}
