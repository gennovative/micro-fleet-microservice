/// <reference types="back-lib-common-constants" />

import { RpcSettingKeys as RpcS, SvcSettingKeys as SvcS } from 'back-lib-common-constants';
import { inject, injectable, Guard } from 'back-lib-common-util';
import { IDirectRpcHandler, IRpcRequest, Types as ComT } from 'back-lib-service-communication';

import { IConfigurationProvider } from './ConfigurationProvider';
import { Types as T } from '../constants/Types';


/**
 * Base class for DirectRpcAddOn.
 */
@injectable()
export abstract class DirectRpcHandlerAddOnBase implements IServiceAddOn {

	constructor(
		protected _configProvider: IConfigurationProvider,
		protected _rpcHandler: IDirectRpcHandler
	) {
		Guard.assertArgDefined('_configProvider', _configProvider);
		Guard.assertArgDefined('_rpcHandler', _rpcHandler);
	}

	/**
	 * @see IServiceAddOn.init
	 */
	public init(): Promise<void> {
		this._rpcHandler.name = this._configProvider.get(SvcS.SERVICE_SLUG);
		this._rpcHandler.port = this._configProvider.get(RpcS.RPC_HANDLER_PORT);
		this._rpcHandler.init();
		this.handleRequests();
		return this._rpcHandler.start();
	}

	/**
	 * @see IServiceAddOn.deadLetter
	 */
	public deadLetter(): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * @see IServiceAddOn.dispose
	 */
	public dispose(): Promise<void> {
		this._configProvider = null;
		let handler = this._rpcHandler;
		this._rpcHandler = null;
		return handler.dispose();
	}


	protected handleRequests(): void {
	}
}