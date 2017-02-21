import { IAdapter } from './IAdapter';
import { IConfigurationAdapter } from './ConfigurationAdapter';
import { IMessageBrokerAdapter, MessageHandler, IMessage } from './MessageBrokerAdapter';


export interface IRoutingAdapter extends IAdapter {
	moduleName: string;

	subscribeRequest(action: string, onMessage: MessageHandler, module?: string): Promise<void>;
	subscribeResponse(action: string, onMessage: MessageHandler, module?: string): Promise<void>;
	subscribe(matchingPattern: string, onMessage: MessageHandler): Promise<void>;
	
	publishRequest(action: string, module?: string): Promise<IMessage>;
	//publishResponse(action: string, module?: string): Promise<void>;
	publish(matchingPattern: string): Promise<IMessage>;
}