import { injectable, inject } from 'back-lib-common-util';
import { IMessageBrokerConnector, IConnectionOptions, Types as ComT } from 'back-lib-service-communication';

import { IConfigurationProvider } from './ConfigurationProvider';
import { SettingKeys as S } from '../constants/SettingKeys';
import { Types as T } from '../constants/Types';


@injectable()
export class MessageBrokerAddOn implements IServiceAddOn {

	constructor(
		@inject(T.CONFIG_PROVIDER) private _configProvider: IConfigurationProvider,
		@inject(ComT.MSG_BROKER_CONNECTOR) private _msgBrokerCnn: IMessageBrokerConnector
	) {
	}
	
	public init(): Promise<void> {
		let cfgAdt = this._configProvider,
			opts: IConnectionOptions = {
				hostAddress: cfgAdt.get(S.MSG_BROKER_HOST),
				username: cfgAdt.get(S.MSG_BROKER_USERNAME),
				password: cfgAdt.get(S.MSG_BROKER_PASSWORD),
				exchange: cfgAdt.get(S.MSG_BROKER_EXCHANGE),
				queue: cfgAdt.get(S.MSG_BROKER_QUEUE)
			};
		return this._msgBrokerCnn.connect(opts);
	}

	public dispose(): Promise<void> {
		return this._msgBrokerCnn.disconnect();
	}
}