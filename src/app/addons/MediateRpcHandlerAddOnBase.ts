import { SvcSettingKeys as S } from 'back-lib-common-constants';
import { IMediateRpcHandler, Types as ComT } from 'back-lib-service-communication';
import { inject, injectable, Guard } from 'back-lib-common-util';

import { IConfigurationProvider } from './ConfigurationProvider';
import { Types as T } from '../constants/Types';


/**
 * Base class for MediateRpcAddOn.
 */
@injectable()
export abstract class MediateRpcHandlerAddOnBase implements IServiceAddOn {

	protected abstract controllerIdentifier: string | symbol;

	constructor(
		protected _configProvider: IConfigurationProvider,
		protected _rpcHandler: IMediateRpcHandler
	) {
		Guard.assertArgDefined('_configProvider', _configProvider);
		Guard.assertArgDefined('_rpcHandler', _rpcHandler);
	}


	/**
	 * @see IServiceAddOn.init
	 */
	public init(): Promise<void> {
		this._rpcHandler.name = this._configProvider.get(S.SERVICE_SLUG);
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
		this._rpcHandler.handleCRUD(this.controllerIdentifier);
	}
}