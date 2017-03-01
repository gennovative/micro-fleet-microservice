import * as express from 'express';
import { MicroServiceBase, inject, injectable, IDirectRpcHandler, IRpcRequest, 
	RpcActionFactory, CriticalException, Types as T} from '../../app';


const HTTP_ADAPTER = Symbol('IHttpAdapter'),
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

interface IHttpAdapter extends IAdapter {
}

@injectable()
class ExpressAdapter implements IHttpAdapter {
	private _express: express.Express;

	constructor(
		@inject(T.DIRECT_RPC_HANDLER) private _rpcHandler: IDirectRpcHandler
	) {
		this._express = express();
		this._rpcHandler.name = 'ProductService'; // Some class implementation may require `name`, some may not.
		this._rpcHandler.init({ 
			expressApp: this._express,
			router: express.Router()
		});
	}

	public init(): Promise<void> {
		return <any>Promise.all([
			this.handleRequests(),
			this.initExpress()
		]);
	}
	
	public dispose(): Promise<void> {
		return Promise.resolve();
	}

	private handleRequests(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
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
		});
	}

	private initExpress(): Promise<void> {
		return new Promise<void>((resolve, reject) => {
			this._express.listen(3000, (err) => {
				if (err) {
					// Write log then reject
					reject(err);
				}
			});
		});
	}
}

class MockMicroService extends MicroServiceBase {
	protected /* override */ registerDependencies(): void {
		super.registerDependencies();

		this.registerDirectRpcHandler();

		this._depContainer.bind<IHttpAdapter>(HTTP_ADAPTER, ExpressAdapter).asSingleton();
		
		// NOTE: It's OK to map a class to itself without interface.
		this._depContainer
			.bind<ProductController>(PRODUCT_CONTROLLER, ProductController)
			// .asSingleton() => May save some resource, but not sure, and not recommend.
			;
		
		
		// No need to call this, because MicroServiceBase already calls it for ConfigAdapter to use.
		// this.registerConfigAdapter();
		// this.registerDirectRpcCaller();
	}

	protected /* override */ onStarting(): void {
		let httpAdt = this._depContainer.resolve<IHttpAdapter>(HTTP_ADAPTER);
		this.addAdapter(httpAdt);
	}
}