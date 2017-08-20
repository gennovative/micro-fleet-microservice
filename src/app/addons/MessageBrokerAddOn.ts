import { MbSettingKeys as S } from 'back-lib-common-constants/dist/setting-keys/message-broker';
import { injectable, inject, Guard } from 'back-lib-common-util';
import { IMessageBrokerConnector, IConnectionOptions, Types as ComT } from 'back-lib-service-communication';

import { IConfigurationProvider } from './ConfigurationProvider';
import { Types as T } from '../constants/Types';


@injectable()
export class MessageBrokerAddOn implements IServiceAddOn {

	constructor(
		@inject(T.CONFIG_PROVIDER) private _configProvider: IConfigurationProvider,
		@inject(ComT.MSG_BROKER_CONNECTOR) private _msgBrokerCnn: IMessageBrokerConnector
	) {
		Guard.assertArgDefined('_configProvider', _configProvider);
		Guard.assertArgDefined('_msgBrokerCnn', _msgBrokerCnn);
	}

	/**
	 * @see IServiceAddOn.init
	 */
	public init(): Promise<void> {
		let cfgAdt = this._configProvider,
			opts: IConnectionOptions = {
				hostAddress: cfgAdt.get(S.MSG_BROKER_HOST),
				username: cfgAdt.get(S.MSG_BROKER_USERNAME),
				password: cfgAdt.get(S.MSG_BROKER_PASSWORD),
				exchange: cfgAdt.get(S.MSG_BROKER_EXCHANGE),
				queue: cfgAdt.get(S.MSG_BROKER_QUEUE),
				reconnectDelay: cfgAdt.get(S.MSG_BROKER_RECONN_TIMEOUT),
				messageExpiredIn: cfgAdt.get(S.MSG_BROKER_RECONN_TIMEOUT),
			};
		return this._msgBrokerCnn.connect(opts);
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
		return this._msgBrokerCnn.disconnect();
	}
}