import { EventEmitter } from 'events';
import * as amqp from 'amqplib';
import * as uuid from 'uuid';

import { IAdapter } from './IAdapter';
import { IConfigurationAdapter } from './ConfigurationAdapter';
import { CriticalException, MinorException } from '../microservice/Exceptions';
import { injectable, inject } from '../utils/DependencyContainer';
import { Guard } from '../utils/Guard';
import { SettingKeys as S } from '../constants/SettingKeys';
import { Types as T } from '../constants/Types';

export type MessageHandler = (msg: IMessage, ack: Function, nack: Function) => void;

interface IQueueInfo {
	name: string;
	matchingPattern: string;
}

export interface IMessage {
	data: any;
	raw: amqp.Message;
	correlationId?: string;
}

export interface IPublishOptions extends amqp.Options.Publish {

}

export interface IMessageBrokerAdapter extends IAdapter {
	/**
	 * Sends `message` to the broker and label the message with `topic`.
	 * @param {string} topic - A name to label the message with. Should be in format "xxx.yyy.zzz".
	 * @param {any} message - A message to send to broker.
	 */
	publish(topic: string, message: any): Promise<void>;

	/**
	 * Listens to messages whose label matches `matchingPattern`.
	 * @param {string} matchingPattern - Pattern to match with message label. Should be in format "xx.*" or "xx.#.#".
	 * @param {function} onMessage - Callback to invoke when there is an incomming message.
	 * @return {string} - A promise with resolve to a consumer tag, which is used to unsubscribe later.
	 */
	subscribe(matchingPattern: string, onMessage: MessageHandler): Promise<string>;

	/**
	 * Stop listening to a subscription that was made before.
	 */
	unsubscribe(consumerTag: string): Promise<void>;
}

@injectable()
export class TopicMessageBrokerAdapter implements IMessageBrokerAdapter {
	
	private _connectionPrm: Promise<amqp.Connection>;
	
	// Each microservice has 2 channels, one for consuming and the other for publishing.
	private _publishChanPrm: Promise<amqp.Channel>;
	private _consumeChanPrm: Promise<amqp.Channel>;

	private _exchange: string;
	private _subscriptions: Map<string, Set<string>>;

	constructor(
		@inject(T.CONFIG_ADAPTER) private _configAdapter: IConfigurationAdapter
	) {
		this._subscriptions = new Map();
	}
	
	public init(): Promise<void> {
		let cfgAdt = this._configAdapter;

		this._exchange = cfgAdt.get(S.MSG_BROKER_EXCHANGE);
		this.connect(cfgAdt.get(S.MSG_BROKER_HOST));
		/*
		this.connect({
			host: cfgAdt.get(S.MSG_BROKER_HOST),
			exchange: cfgAdt.get(S.MSG_BROKER_EXCHANGE),
			reconnectTimeout: cfgAdt.get(S.MSG_BROKER_RECONN_TIMEOUT)
		});
		//*/
		return Promise.resolve();
	}

	public async dispose(): Promise<void> {
		this.disconnect();
		this._connectionPrm = null;
		this._publishChanPrm = null;
		this._consumeChanPrm = null;
	}

	public async subscribe(matchingPattern: string, onMessage: MessageHandler, noAck?: boolean): Promise<string> {
		Guard.assertNotEmpty('matchingPattern', matchingPattern);
		Guard.assertIsFunction('onMessage', onMessage);
		try {
			let channelPromise = this._consumeChanPrm;
			if (!channelPromise) {
				// Create a new consuming channel if there is not already, and from now on we listen to this only channel.
				channelPromise = this._consumeChanPrm = this.createChannel();
			}
			
			let ch = await channelPromise;
				
			// The consuming channel should bind to only one queue, but that queue can be routed with multiple keys.
			await this.bindQueue(channelPromise, matchingPattern);

			let conResult = await ch.consume(null, 
				(msg: amqp.Message) => {
					let ack = () => ch.ack(msg),
						nack = () => ch.nack(msg);

					onMessage(this.parseMessage(msg), ack, nack);
				}, 
				{noAck: noAck || false}
			);
			this.moreSub(matchingPattern, conResult.consumerTag);
			return conResult.consumerTag;

		} catch (err) {
			return this.handleError(err, 'Subscription error');
		}
	}

	public async publish(topic: string, message: any, options?: IPublishOptions): Promise<void> {
		Guard.assertNotEmpty('topic', topic);
		Guard.assertNotEmpty('message', message);
		try {
			if (!this._publishChanPrm) {
				// Create a new publishing channel if there is not already, and from now on we publish to this only channel.
				this._publishChanPrm = this.createChannel();
			}
			let ch = await this._publishChanPrm;

			// We publish to exchange, then the exchange will route to appropriate consuming queue.
			ch.publish(this._exchange, topic, new Buffer(message), options);

		} catch (err) {
			return this.handleError(err, 'Publishing error');
		}
	}

	public rpc(requestTopic: string, responseTopic: string, message: any): Promise<IMessage> {
		return new Promise<IMessage>((resolve, reject) => {
			// There are many requests to same `requestTopic` and they listen to same `responseTopic`,
			// A request only carea for a response with same `correlationId`.
			const correlationId = uuid.v4();

			let conCh = this._consumeChanPrm,
				resEmitter = conCh['responseEmitter'];
			
			this.subscribe(responseTopic, (msg: IMessage, ack: Function, nack: Function) => {
				// Announce that we've got a message with this correlationId.
				resEmitter.emit(msg.correlationId, msg);
			})
			.then(consumerTag => {
				resEmitter.once(correlationId, msg => {
					// We got what we want, stop consuming.
					this.unsubscribe(consumerTag);
					
					// Resolve only when we get the response with matched correlationId.
					resolve(msg);
				});

				// Send request, marking the message with correlationId.
				return this.publish(requestTopic, message, { correlationId });
			})
			.catch(err => {
				reject(new MinorException(`RPC error: ${err}`));
			});
		});

	}

	public async unsubscribe(consumerTag: string): Promise<void> {
		try {
			if (!this._consumeChanPrm) {
				return;
			}

			let ch = await this._consumeChanPrm;

			// onMessage callback will never be called again.
			await ch.cancel(consumerTag);
			
			let unusedPattern = this.lessSub(consumerTag);
			if (unusedPattern) {
				this.unbindQueue(this._consumeChanPrm, unusedPattern);
			}

		} catch (err) {
			return this.handleError(err, 'Unsubscription error');
		}
	}


	private connect(hostAddress: string): Promise<amqp.Connection> {
		return this._connectionPrm = <any>amqp.connect(`amqp://${hostAddress}`)
			.catch(err => {
				return this.handleError(err, 'Connection creation error');
			});
	}

	private async disconnect() {
		try {
			if (!this._connectionPrm || !this._consumeChanPrm) {
				return;
			}
			
			let ch: amqp.Channel,
				promises = [];

			if (this._consumeChanPrm) {
				let queueName = ch['queue'];

				ch = await this._consumeChanPrm;

				// Destroy the queue, any waiting messages will be re-routed to another queue by the exchange.
				promises.push(ch.deleteQueue(queueName));

				// Close consuming channel
				promises.push(ch.close());
			}

			if (this._publishChanPrm) {
				ch = await this._publishChanPrm;
				// Close publishing channel
				promises.push(ch.close());
			}

			if (this._connectionPrm) {
				let conn: amqp.Connection = await this._connectionPrm;
				// Close connection
				promises.push(conn.close());
			}

			await Promise.all(promises);

		} catch (err) {
			return this.handleError(err, 'Connection closing error');
		}
	}

	private async createChannel(): Promise<amqp.Channel> {
		const EXCHANGE_TYPE = 'topic';

		try {
			let conn = await this._connectionPrm,
				ch = await conn.createChannel(),

				// Tell message broker to create an exchange with this name if there's not any already.
				// Setting exchange as "durable" means the exchange with same name will be re-created after the message broker restarts,
				// but all queues and waiting messages will be lost.
				exResult = await ch.assertExchange(this._exchange, EXCHANGE_TYPE, {durable: true});

			ch['queue'] = {};
			ch['responseEmitter'] = new EventEmitter();
			ch['responseEmitter'].setMaxListeners(0);
			return Promise.resolve(ch);

		} catch (err) {
			return this.handleError(err, 'Channel creation error');
		}
	}

	/**
	 * If `queueName` is null, creates a queue and binds it to `matchingPattern`.
	 * If `queueName` is not null, binds `matchingPattern` to the queue with that name.
	 * @return {string} null if no queue is created, otherwise returns the new queue name.
	 */
	private async bindQueue(channelPromise: Promise<amqp.Channel>, matchingPattern: string): Promise<void> {
		try {
			let ch = await channelPromise,
				queueName = ch['queue'],
				
				// Provide empty string as queue name to tell message broker to choose a unique name for us.
				// Setting queue as "exclusive" to delete the queue when connection closes.
				quResult = await ch.assertQueue(queueName || '', {exclusive: true});

			await ch.bindQueue(quResult.queue, this._exchange, matchingPattern);

			// Store queue name for later use.
			// In our system, each channel is associated with only one queue.
			ch['queue'] = quResult.queue;

		} catch (err) {
			return this.handleError(err, 'Queue binding error');
		}
	}

	private async unbindQueue(channelPromise: Promise<amqp.Channel>, matchingPattern: string): Promise<void> {
		try {
			let ch = await channelPromise,
				queueName = ch['queue'];

			await ch.unbindQueue(queueName, this._exchange, matchingPattern);

		} catch (err) {
			return this.handleError(err, 'Queue unbinding error');
		}
	}

	private handleError(err, message: string): Promise<never> {
		if (err instanceof CriticalException) {
			// If this is already a wrapped exception.
			return Promise.reject(err);
		}
		return Promise.reject(new CriticalException(`${message}: ${err}`));
	}
	
	private moreSub(matchingPattern: string, consumerTag: string): void {
		let consumers: Set<string> = this._subscriptions.get(matchingPattern);

		if (!consumers) {
			this._subscriptions.set(matchingPattern, new Set(consumerTag));
			return;
		}
		consumers.add(consumerTag);
	}

	/**
	 * @return {string} the pattern name which should be unbound, othewise return null.
	 */
	private lessSub(consumerTag: string): string {
		let subscriptions = this._subscriptions,
			matchingPattern = null;
		
		for(let sub of subscriptions) {
			if (!sub[1].has(consumerTag)) { continue; }

			// Remove this tag from consumer list.
			sub[1].delete(consumerTag);
			
			// If consumer list becomes empty.
			if (!sub[1].size) {
				// Mark this pattern as unused and should be unbound.
				matchingPattern = sub[0];
				subscriptions.delete(matchingPattern);
			}
			break;
		}

		return matchingPattern;
	}

	private parseMessage(raw: amqp.Message): IMessage {
		return {
			raw,
			data: JSON.parse(raw.content.toJSON().data.toString()),
			correlationId: raw.properties.correlationId
		};
	}
}