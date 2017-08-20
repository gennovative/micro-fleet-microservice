import { expect } from 'chai';

import { RpcSettingKeys as RpcS, SvcSettingKeys as SvcS } from 'back-lib-common-constants';
import { injectable, inject, Guard } from 'back-lib-common-util';
import { IDirectRpcHandler, Types as ComT } from 'back-lib-service-communication';

import { MicroServiceBase, IConfigurationProvider, 
	DirectRpcHandlerAddOnBase, Types as T } from '../../app';


const SVC_SLUG = 'test-service',
	HANDLER_PORT = 30000,
	CUSTOM_ADT = Symbol('CustomAddOn');

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
class CustomAddOn extends DirectRpcHandlerAddOnBase {

	constructor(
		@inject(T.CONFIG_PROVIDER) configProvider: IConfigurationProvider,
		@inject(ComT.DIRECT_RPC_HANDLER) rpcHandler: IDirectRpcHandler
	) {
		super(configProvider, rpcHandler);
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
		this._depContainer.bind<CustomAddOn>(CUSTOM_ADT, CustomAddOn);

		// `registerConfigProvider()` is already called by MicroServiceBase.
		// However, in this case, we want to override with our mock instance.
		this._depContainer.bind<IConfigurationProvider>(T.CONFIG_PROVIDER, MockConfigProvider).asSingleton();
		
		// If your service accepts direct incoming requests.
		this.registerDirectRpcHandler();
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

describe('DirectRpcHandlerAddOnBase', () => {
	describe('init', () => {
		it('Should set RPC handler name and port', (done) => {
			let svc = new TestService();

			svc['onStarted'] = function() {
				this._addons.forEach(addon => {
					if (addon instanceof CustomAddOn) {
						expect(addon['_rpcHandler'].name).to.equal(SVC_SLUG);
						expect(addon['_rpcHandler'].port).to.equal(HANDLER_PORT);
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