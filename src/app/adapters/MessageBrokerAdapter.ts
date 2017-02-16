import { IAdapter } from './IAdapter';
import { IConfigurationAdapter } from './ConfigurationAdapter';
import { injectable, inject } from '../utils/DependencyContainer';
import { SettingKeys as S } from '../constants/SettingKeys';
import { Types as T } from '../constants/Types';

export interface IMessageBrokerAdapter extends IAdapter {
	
}

@injectable()
export class MessageBrokerAdapter implements IMessageBrokerAdapter {
	
	private _channel;

	constructor(
		@inject(T.CONFIG_ADAPTER) private _configAdapter: IConfigurationAdapter
	) {
	}
	
	public init(): Promise<boolean> {
		let cfgAdt = this._configAdapter;
		// Read more: https://github.com/yamalight/microwork
		/*
		this._channel = new Microwork({
			host: cfgAdt.get(S.MSG_BROKER_HOST),
			exchange: cfgAdt.get(S.MSG_BROKER_EXCHANGE),
			reconnectTimeout: cfgAdt.get(S.MSG_BROKER_RECONN_TIMEOUT)
		});
		//*/
		return Promise.resolve(true);
	}
}