import { injectable, inject, IDependencyContainer, Guard, Exception } from 'back-lib-common-util';

import { Types as T } from '../constants/Types';
import { IMessageBrokerAdapter, MessageHandleFunction, IMessage } from '../adapters/MessageBrokerAdapter';
import * as rpc from './RpcCommon';


export interface IMediateRpcHandler extends rpc.IRpcHandler {
}

@injectable()
export class MessageBrokerRpcHandler
			extends rpc.RpcHandlerBase
			implements IMediateRpcHandler {
	
	constructor(
		@inject(T.DEPENDENCY_CONTAINER) depContainer: IDependencyContainer,
		@inject(T.BROKER_ADAPTER) private _msgBrokerAdt: IMessageBrokerAdapter
	) {
		super(depContainer);
	}


	public init(param?: any): void {
	}

	public handle(action: string, dependencyIdentifier: string | symbol, actionFactory?: rpc.RpcActionFactory) {
		Guard.assertDefined('action', action);
		Guard.assertDefined('dependencyIdentifier', dependencyIdentifier);
		Guard.assertDefined(null, this._name, '`name` property is required.');
		
		this._msgBrokerAdt.subscribe(`request.${this._name}.${action}`, this.buildHandleFunc.apply(this, arguments));
	}


	private buildHandleFunc(action: string, dependencyIdentifier: string | symbol, actionFactory?: rpc.RpcActionFactory): MessageHandleFunction {
		return (msg: IMessage) => {
			let request: rpc.IRpcRequest = msg.data,
				replyTo: string = msg.properties.replyTo,
				correlationId = msg.properties.correlationId;
			
			(new Promise((resolve, reject) => {
				let actionFn = this.resolveActionFunc(action, dependencyIdentifier, actionFactory);
				// Execute controller's action
				actionFn(request, resolve, reject);
			}))
			.then(result => { // When `actionFn` calls `resolve` from inside.
				// Sends response to reply topic
				return this._msgBrokerAdt.publish(replyTo, this.createResponse(true, result, request.from), { correlationId });
			})
			.catch(error => {
				let errMsg = error;
				// If error is an uncaught Exception object, that means the action method
				// has a problem. We should nack to tell message broker to send this message to someone else.
				if (error instanceof Exception) {
					// TODO: Should log this unexpected error.
					errMsg = error.message;
				}

				// If this is a custom error, which means the action method sends this error
				// back to caller on purpose.
				return this._msgBrokerAdt.publish(replyTo, this.createResponse(false, errMsg, request.from), { correlationId });
			});
		};
	}
}