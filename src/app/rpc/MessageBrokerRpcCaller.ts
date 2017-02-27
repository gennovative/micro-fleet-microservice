import { EventEmitter } from 'events';

import * as uuid from 'uuid';

import * as ex from '../microservice/Exceptions';
import { Guard } from '../utils/Guard';
import { Types as T } from '../constants/Types';
import { injectable, inject, IDependencyContainer } from '../utils/DependencyContainer';
import { IMessageBrokerAdapter, MessageHandleFunction, IMessage } from '../adapters/MessageBrokerAdapter';
import { RpcCallerBase, IRpcCaller } from './RpcCallerBase';
import { IRpcRequest, IRpcResponse } from './RpcModels';


@injectable()
export class MessageBrokerRpcCaller
			extends RpcCallerBase
			implements IRpcCaller {

	constructor(
		@inject(T.BROKER_ADAPTER) private _msgBrokerAdt: IMessageBrokerAdapter
	) {
		super();
	}

	call(moduleName: string, action: string, param: any): Promise<IRpcResponse> {
		Guard.assertDefined('moduleName', moduleName);
		Guard.assertDefined('action', action);

		return new Promise<IRpcResponse>((resolve, reject) => {
			// There are many requests to same `requestTopic` and they listen to same `responseTopic`,
			// A request only carea for a response with same `correlationId`.
			const correlationId = uuid.v4();

			let emitter = new EventEmitter();

			this._msgBrokerAdt.subscribe(`response.${moduleName}.${action}`, (msg: IMessage, ack: Function, nack?: Function) => {
				let intervalId = setInterval(() => {
					// There are chances that the message comes before the below
					// `emitter.once` runs. So let's make sure we only emit event
					// when there is a listener.
					if (emitter.listenerCount(msg.properties.correlationId)) {
						clearInterval(intervalId);
						intervalId = null;

						// Announce that we've got a message with this correlationId.
						emitter.emit(msg.properties.correlationId, msg);
						emitter = null;
					}
				}, 100);
			})
			.then(consumerTag => {
				emitter.once(correlationId, (msg: IMessage) => {
					// We got what we want, stop consuming.
					this._msgBrokerAdt.unsubscribe(consumerTag);
					resolve(<IRpcResponse>msg.data);
				});

				let request: IRpcRequest = {
					from: this._name,
					to: moduleName,
					param
				};

				// Send request, marking the message with correlationId.
				return this._msgBrokerAdt.publish(`request.${moduleName}.${action}`, request, { correlationId });
			})
			.catch(err => {
				reject(new ex.MinorException(`RPC error: ${err}`));
			});
		});
	}
}