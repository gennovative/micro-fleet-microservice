import * as ex from '../microservice/Exceptions';
import { Guard } from '../utils/Guard';
import { Types as T } from '../constants/Types';
import { injectable, inject, IDependencyContainer } from '../utils/DependencyContainer';
import { IMessageBrokerAdapter, MessageHandleFunction, IMessage } from '../adapters/MessageBrokerAdapter';
import { RpcHandlerBase, IRpcHandler, RpcActionFactory, RpcControllerFunction } from './RpcHandlerBase';
import { IRpcRequest, IRpcResponse } from './RpcModels';

@injectable()
export class MessageBrokerRpcHandler
			extends RpcHandlerBase
			implements IRpcHandler {
	
	constructor(
		@inject(T.DEPENDENCY_CONTAINER) depContainer: IDependencyContainer,
		@inject(T.BROKER_ADAPTER) private _msgBrokerAdt: IMessageBrokerAdapter
	) {
		super(depContainer);
	}

	public handle(action: string, dependencyIdentifier: string | symbol, actionFactory?: RpcActionFactory) {
		Guard.assertDefined('action', action);
		Guard.assertDefined('dependencyIdentifier', dependencyIdentifier);

		let actionFn = this.resolveActionFunc(action, dependencyIdentifier, actionFactory);
		
		this._msgBrokerAdt.subscribe(`request.${this._name}.${action}`, this.buildHandleFunc(actionFn));
	}


	private buildHandleFunc(actionFn: RpcControllerFunction): MessageHandleFunction {
		return (msg: IMessage, ack: () => void, nack: () => void) => {
			let request: IRpcRequest = msg.data,
				replyTopic: string = msg.properties.replyTopic,
				correlationId = msg.properties.correlationId;
			
			(new Promise((resolve, reject) => {
				// Execute controller's action
				actionFn(request, resolve, reject);
			}))
			.then(result => { // When `actionFn` calls `resolve` from inside.
				// Sends response to reply topic
				return this._msgBrokerAdt.publish(replyTopic, this.createResponse(true, result, request.from), { correlationId });
			})
			.then(ack) // Only ack when the response has been sent, which means message broker can remove this message from queue.
			.catch(error => {
				// If error is an uncaught Exception object, that means the action method
				// has a problem. We should nack to tell message broker to send this message to someone else.
				if (error instanceof ex.Exception) {
					// TODO: Should log this unexpected error.
					nack();
				}

				// If this is a custom error, which means the action method sends this error
				// back to caller on purpose.
				return this._msgBrokerAdt.publish(replyTopic, this.createResponse(false, error, request.from), { correlationId });
			});
		};
	}
}