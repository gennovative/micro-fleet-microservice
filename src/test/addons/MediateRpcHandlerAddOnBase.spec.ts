import { expect } from 'chai';

import { RpcSettingKeys as RpcS, SvcSettingKeys as SvcS } from 'back-lib-common-constants';
import { injectable, inject, Guard } from 'back-lib-common-util';
import { IMediateRpcHandler, IRpcRequest, IMessageBrokerConnector,
	IConnectionOptions, IPublishOptions, MessageHandleFunction,
	Types as ComT } from 'back-lib-service-communication';

import { MicroServiceBase, IConfigurationProvider, 
	MediateRpcHandlerAddOnBase, Types as T } from '../../app';


const SVC_SLUG = 'test-service',
	HANDLER_PORT = 30000,
	CUSTOM_ADT = Symbol('CustomAddOn'),
	CUSTOM_CTL = Symbol('CustomController');

@injectable()
class MockConfigProvider implements IConfigurationProvider {
	
	get enableRemote(): boolean {
		return true;
	}

	public init(): Promise<void> {
		return Promise.resolve();
	}

	public deadLetter(): Promise<void> {
		return Promise.resolve();
	}

	public dispose(): Promise<void> {
		return Promise.resolve();
	}

	public onUpdate(listener: (changedKeys: string[]) => void) {

	}

	public get(key: string): number & boolean & string {
		switch (key) {
			case SvcS.SERVICE_SLUG: return <any>SVC_SLUG;
			case RpcS.RPC_HANDLER_PORT: return <any>HANDLER_PORT;
			default: return null;
		}
	}

	public async fetch(): Promise<boolean> {
		return Promise.resolve(true);
	}
}

@injectable()
class MockMbConnector implements IMessageBrokerConnector {
	public messageExpiredIn: number;
	public subscribedPatterns: string[];

	private _connections = [];

	public get queue(): string {
		return '';
	}

	public connect(options: IConnectionOptions): Promise<void> {
		return Promise.resolve();
	}
	
	public disconnect(): Promise<void> {
		return Promise.resolve();
	}
	
	public deleteQueue(): Promise<void> {
		return Promise.resolve();
	}
	
	public emptyQueue(): Promise<number> {
		return Promise.resolve(0);
	}

	public listen(onMessage: MessageHandleFunction, noAck?: boolean): Promise<void> {
		return Promise.resolve();
	}

	public stopListen(): Promise<void> {
		return Promise.resolve();
	}

	public publish(topic: string, payload: string | Json | JsonArray, options?: IPublishOptions): Promise<void> {
		return Promise.resolve();
	}

	public subscribe(matchingPattern: string): Promise<void> {
		return Promise.resolve();
	}

	public unsubscribe(consumerTag: string): Promise<void> {
		return Promise.resolve();
	}

	public unsubscribeAll(): Promise<void> {
		return Promise.resolve();
	}

	public onError(handler: (err) => void): void {
	}
}

@injectable()
class CustomController {
	public add(requestPayload: any, resolve: PromiseResolveFn, reject: PromiseRejectFn, rawRequest: IRpcRequest): void {
	}

	public remove(requestPayload: any, resolve: PromiseResolveFn, reject: PromiseRejectFn, rawRequest: IRpcRequest): void {
	}

	public echo(requestPayload: any, resolve: PromiseResolveFn, reject: PromiseRejectFn, rawRequest: IRpcRequest): void {
	}
}

@injectable()
class CustomAddOn extends MediateRpcHandlerAddOnBase {

	protected controllerIdentifier: string | symbol;

	constructor(
		@inject(T.CONFIG_PROVIDER) configProvider: IConfigurationProvider,
		@inject(ComT.MEDIATE_RPC_HANDLER) rpcHandler: IMediateRpcHandler
	) {
		super(configProvider, rpcHandler);
		this.controllerIdentifier = 'CustomController';
	}

	/**
	 * @see IServiceAddOn.init
	 */
	public init(): Promise<void> {
		return super.init();
	}

	/**
	 * @see IServiceAddOn.deadLetter
	 */
	public deadLetter(): Promise<void> {
		return super.deadLetter();
	}

	/**
	 * @see IServiceAddOn.dispose
	 */
	public dispose(): Promise<void> {
		return super.dispose();
	}

	/**
	 * @override
	 */
	protected handleRequests(): void {
		super.handleRequests();
		this._rpcHandler.handle('add', '');
	}
}


class TestService extends MicroServiceBase {
	
	/**
	 * @override
	 */
	protected registerDependencies(): void {
		super.registerDependencies();
		this._depContainer.bind<CustomController>(CUSTOM_CTL, CustomController);
		this._depContainer.bind<CustomAddOn>(CUSTOM_ADT, CustomAddOn);

		// `registerConfigProvider()` is already called by MicroServiceBase.
		// However, in this case, we want to override with our mock instance.
		this._depContainer.bind<IConfigurationProvider>(T.CONFIG_PROVIDER, MockConfigProvider).asSingleton();
		this._depContainer.bind<IMessageBrokerConnector>(ComT.MSG_BROKER_CONNECTOR, MockMbConnector).asSingleton();
		
		// If your service accepts direct incoming requests.
		this.registerMediateRpcHandler();
	}

	/**
	 * @override
	 */
	protected onStarting(): void {
		// Use this if you have a home-made add-on.
		// All added add-ons' init method will be called 
		let customAddOn = this._depContainer.resolve<CustomAddOn>(CUSTOM_ADT);
		this.attachAddOn(customAddOn);
	}

	/**
	 * @override
	 */
	protected onError(error: any): void {
		super.onError(error);
	}
}

describe('MediateRpcHandlerAddOnBase', () => {
	describe('init', () => {
		it('Should set RPC handler name and port', (done) => {
			let svc = new TestService();

			svc['onStarted'] = function() {
				this._addons.forEach(addon => {
					if (addon instanceof CustomAddOn) {
						expect(addon['_rpcHandler'].name).to.equal(SVC_SLUG);
						this.stop(false);
					}
				});
			};
			svc['onStopped'] = function() {
				done();
			};

			svc.start();

		});
	}); // END describe 'init'
});