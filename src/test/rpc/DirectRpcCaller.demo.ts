import { inject, injectable, MinorException } from 'back-lib-common-util';
import { IDirectRpcCaller, IRpcResponse, Types as ComT } from 'back-lib-service-communication';

import { MicroServiceBase } from '../../app';


const PRODUCT_PROVIDER = Symbol('IProductProvider');

class ProductDTO {
	public name: string = undefined;
}

interface IProductProvider {
	getProduct(id: number): Promise<ProductDTO>;
}

@injectable()
class MockProductProvider implements IProductProvider {
	
	constructor(
		@inject(ComT.DIRECT_RPC_CALLER) private _rpcCaller: IDirectRpcCaller
	) {
		this._rpcCaller.name = 'MockProvider'; // Not very important, for logging purpose.
		this._rpcCaller.baseAddress = 'product.com'; // NOTE: No "http://" at the head. No "/" at the end.
	}

	public async getProduct(id: number): Promise<ProductDTO> {
		// Make POST request to http://product.com/ProductService/getProduct if use HTTP Protocol.
		// But maybe another protocol is used. This class should not care!
		return this._rpcCaller
			.call('ProductService', 'getProduct', { id })
			.then(this.handleResponse);
	}

	private handleResponse(res: IRpcResponse): any {
		if (res.isSuccess) {
			return res.data; // Optional casting. For better readability, not affect performance.
		} else {			
			// The top layer should catch() error and decide what to do (writting logs, kill and restart process, ...).
			// We don't catch error here, just throw it up.
			throw new MinorException(res.data);
		}
	}
}

class MockMicroService extends MicroServiceBase {
	protected /* override */ registerDependencies(): void {
		super.registerDependencies();

		this._depContainer.bind<IProductProvider>(PRODUCT_PROVIDER, MockProductProvider);
		
		// No need to call these, because MicroServiceBase already calls them.
		// this.registerConfigProvider();
		// this.registerDirectRpcCaller();
		// this.registerModelMapper();
	}
}