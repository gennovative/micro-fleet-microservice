import * as express from 'express';
import { inject, injectable, CriticalException } from 'back-lib-common-util';
import { IDirectRpcHandler, IRpcRequest, RpcActionFactory, Types as ComT} from 'back-lib-service-communication';

import { MicroServiceBase } from '../../app';


const HTTP_ADDON = Symbol('IHttpAddOn'),
	PRODUCT_CONTROLLER = Symbol('ProductController');

// NOTE: Should put in ~/app/controllers/ProductController.ts
@injectable()
class ProductController {

	constructor(
		//inject Product Repository here
	) {
	}

	// This method must have these parameters: request, resolve, reject
	public getProduct(request: IRpcRequest, resolve: PromiseResolveFn, reject: PromiseRejectFn): void {
		let id = request.params.id;
		if (!id) {
			reject('Product id is required!');
			return;
		}

		let product; //= await productRepo.find(id);
		resolve(product);
	}

	public remove(request: IRpcRequest, resolve: PromiseResolveFn, reject: PromiseRejectFn): void {
		// `resolve` if success => response with status: 200, isSuccess: true
		// `reject` if it's the caller's fault (validation issues) => response with status: 200, isSuccess: false
		
		if (request.from == 'UglyService') {
			// If it's due to this method's fault/error => response with status: 500, isSucess: false
			// The caller should try calling someone else.
			throw new CriticalException('I hate you. Do not talk to you!');
		}
	}
}

interface IHttpAddOn extends IServiceAddOn {
}

@injectable()
class ExpressAddOn implements IHttpAddOn {
	private _express: express.Express;

	constructor(
		@inject(ComT.DIRECT_RPC_HANDLER) private _rpcHandler: IDirectRpcHandler
	) {
		this._express = express();
		this._rpcHandler.name = 'ProductService'; // Some class implementation may require `name`, some may not.
		this._rpcHandler.init();
	}

	public async init(): Promise<void> {
		this.handleRequests();
		await this.initExpress();
	}
	
	public dispose(): Promise<void> {
		return Promise.resolve();
	}

	private handleRequests(): void {
		let rpc = this._rpcHandler;
		
		// If controller has a method with same name (eg: 'getProduct')
		rpc.handle('getProduct', PRODUCT_CONTROLLER);

		// If controller has different method name, or wants to do something
		// more complicated.
		let factory: RpcActionFactory = (controller: ProductController) => controller.remove.bind(controller);

		// More verbose version, same job.
		// let factory: RpcActionFactory = (controller: ProductController) => {
		//	return controller.remove.bind(controller);
		// };

		rpc.handle('deleteProduct', PRODUCT_CONTROLLER, factory);
	}

	private initExpress(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this._express.listen(3000, (err) => {
				if (err) {
					// Write log then reject
					reject(err);
					return;
				}
				resolve();
			});
		});
	}
}

class MockMicroService extends MicroServiceBase {
	
	/**
	 * @override
	 */
	protected registerDependencies(): void {
		super.registerDependencies();

		this.registerDirectRpcHandler();

		this._depContainer.bind<IHttpAddOn>(HTTP_ADDON, ExpressAddOn).asSingleton();
		
		// NOTE: It's OK to map a class to itself without interface.
		this._depContainer
			.bind<ProductController>(PRODUCT_CONTROLLER, ProductController)
			// .asSingleton() => May save some resource, but not sure, and not recommend.
			;
		
		
		// No need to call these, because MicroServiceBase already calls them.
		// this.registerConfigProvider();
		// this.registerDirectRpcCaller();
		// this.registerModelMapper();
	}

	/**
	 * @override
	 */
	protected onStarting(): void {
		let httpAdt = this._depContainer.resolve<IHttpAddOn>(HTTP_ADDON);
		this.attachAddOn(httpAdt);
	}
}