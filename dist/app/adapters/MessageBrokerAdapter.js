"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const events_1 = require("events");
const amqp = require("amqplib");
const uuid = require("uuid");
const Exceptions_1 = require("../microservice/Exceptions");
const DependencyContainer_1 = require("../utils/DependencyContainer");
const Guard_1 = require("../utils/Guard");
const SettingKeys_1 = require("../constants/SettingKeys");
const Types_1 = require("../constants/Types");
let TopicMessageBrokerAdapter = class TopicMessageBrokerAdapter {
    constructor(_configAdapter) {
        this._configAdapter = _configAdapter;
        this._subscriptions = new Map();
    }
    init() {
        let cfgAdt = this._configAdapter;
        this._exchange = cfgAdt.get(SettingKeys_1.SettingKeys.MSG_BROKER_EXCHANGE);
        this.connect(cfgAdt.get(SettingKeys_1.SettingKeys.MSG_BROKER_HOST));
        /*
        this.connect({
            host: cfgAdt.get(S.MSG_BROKER_HOST),
            exchange: cfgAdt.get(S.MSG_BROKER_EXCHANGE),
            reconnectTimeout: cfgAdt.get(S.MSG_BROKER_RECONN_TIMEOUT)
        });
        //*/
        return Promise.resolve();
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            this.disconnect();
            this._connectionPrm = null;
            this._publishChanPrm = null;
            this._consumeChanPrm = null;
        });
    }
    subscribe(matchingPattern, onMessage, noAck) {
        return __awaiter(this, void 0, void 0, function* () {
            Guard_1.Guard.assertNotEmpty('matchingPattern', matchingPattern);
            Guard_1.Guard.assertIsFunction('onMessage', onMessage);
            try {
                let channelPromise = this._consumeChanPrm;
                if (!channelPromise) {
                    // Create a new consuming channel if there is not already, and from now on we listen to this only channel.
                    channelPromise = this._consumeChanPrm = this.createChannel();
                }
                let ch = yield channelPromise;
                // The consuming channel should bind to only one queue, but that queue can be routed with multiple keys.
                yield this.bindQueue(channelPromise, matchingPattern);
                let conResult = yield ch.consume(null, (msg) => {
                    let ack = () => ch.ack(msg), nack = () => ch.nack(msg);
                    onMessage(this.parseMessage(msg), ack, nack);
                }, { noAck: noAck || false });
                this.moreSub(matchingPattern, conResult.consumerTag);
                return conResult.consumerTag;
            }
            catch (err) {
                return this.handleError(err, 'Subscription error');
            }
        });
    }
    publish(topic, message, options) {
        return __awaiter(this, void 0, void 0, function* () {
            Guard_1.Guard.assertNotEmpty('topic', topic);
            Guard_1.Guard.assertNotEmpty('message', message);
            try {
                if (!this._publishChanPrm) {
                    // Create a new publishing channel if there is not already, and from now on we publish to this only channel.
                    this._publishChanPrm = this.createChannel();
                }
                let ch = yield this._publishChanPrm;
                // We publish to exchange, then the exchange will route to appropriate consuming queue.
                ch.publish(this._exchange, topic, new Buffer(message), options);
            }
            catch (err) {
                return this.handleError(err, 'Publishing error');
            }
        });
    }
    rpc(requestTopic, responseTopic, message) {
        return new Promise((resolve, reject) => {
            // There are many requests to same `requestTopic` and they listen to same `responseTopic`,
            // A request only carea for a response with same `correlationId`.
            const correlationId = uuid.v4();
            let conCh = this._consumeChanPrm, resEmitter = conCh['responseEmitter'];
            this.subscribe(responseTopic, (msg, ack, nack) => {
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
                reject(new Exceptions_1.MinorException(`RPC error: ${err}`));
            });
        });
    }
    unsubscribe(consumerTag) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this._consumeChanPrm) {
                    return;
                }
                let ch = yield this._consumeChanPrm;
                // onMessage callback will never be called again.
                yield ch.cancel(consumerTag);
                let unusedPattern = this.lessSub(consumerTag);
                if (unusedPattern) {
                    this.unbindQueue(this._consumeChanPrm, unusedPattern);
                }
            }
            catch (err) {
                return this.handleError(err, 'Unsubscription error');
            }
        });
    }
    connect(hostAddress) {
        return this._connectionPrm = amqp.connect(`amqp://${hostAddress}`)
            .catch(err => {
            return this.handleError(err, 'Connection creation error');
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this._connectionPrm || !this._consumeChanPrm) {
                    return;
                }
                let ch, promises = [];
                if (this._consumeChanPrm) {
                    let queueName = ch['queue'];
                    ch = yield this._consumeChanPrm;
                    // Destroy the queue, any waiting messages will be re-routed to another queue by the exchange.
                    promises.push(ch.deleteQueue(queueName));
                    // Close consuming channel
                    promises.push(ch.close());
                }
                if (this._publishChanPrm) {
                    ch = yield this._publishChanPrm;
                    // Close publishing channel
                    promises.push(ch.close());
                }
                if (this._connectionPrm) {
                    let conn = yield this._connectionPrm;
                    // Close connection
                    promises.push(conn.close());
                }
                yield Promise.all(promises);
            }
            catch (err) {
                return this.handleError(err, 'Connection closing error');
            }
        });
    }
    createChannel() {
        return __awaiter(this, void 0, void 0, function* () {
            const EXCHANGE_TYPE = 'topic';
            try {
                let conn = yield this._connectionPrm, ch = yield conn.createChannel(), 
                // Tell message broker to create an exchange with this name if there's not any already.
                // Setting exchange as "durable" means the exchange with same name will be re-created after the message broker restarts,
                // but all queues and waiting messages will be lost.
                exResult = yield ch.assertExchange(this._exchange, EXCHANGE_TYPE, { durable: true });
                ch['queue'] = {};
                ch['responseEmitter'] = new events_1.EventEmitter();
                ch['responseEmitter'].setMaxListeners(0);
                return Promise.resolve(ch);
            }
            catch (err) {
                return this.handleError(err, 'Channel creation error');
            }
        });
    }
    /**
     * If `queueName` is null, creates a queue and binds it to `matchingPattern`.
     * If `queueName` is not null, binds `matchingPattern` to the queue with that name.
     * @return {string} null if no queue is created, otherwise returns the new queue name.
     */
    bindQueue(channelPromise, matchingPattern) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let ch = yield channelPromise, queueName = ch['queue'], 
                // Provide empty string as queue name to tell message broker to choose a unique name for us.
                // Setting queue as "exclusive" to delete the queue when connection closes.
                quResult = yield ch.assertQueue(queueName || '', { exclusive: true });
                yield ch.bindQueue(quResult.queue, this._exchange, matchingPattern);
                // Store queue name for later use.
                // In our system, each channel is associated with only one queue.
                ch['queue'] = quResult.queue;
            }
            catch (err) {
                return this.handleError(err, 'Queue binding error');
            }
        });
    }
    unbindQueue(channelPromise, matchingPattern) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let ch = yield channelPromise, queueName = ch['queue'];
                yield ch.unbindQueue(queueName, this._exchange, matchingPattern);
            }
            catch (err) {
                return this.handleError(err, 'Queue unbinding error');
            }
        });
    }
    handleError(err, message) {
        if (err instanceof Exceptions_1.CriticalException) {
            // If this is already a wrapped exception.
            return Promise.reject(err);
        }
        return Promise.reject(new Exceptions_1.CriticalException(`${message}: ${err}`));
    }
    moreSub(matchingPattern, consumerTag) {
        let consumers = this._subscriptions.get(matchingPattern);
        if (!consumers) {
            this._subscriptions.set(matchingPattern, new Set(consumerTag));
            return;
        }
        consumers.add(consumerTag);
    }
    /**
     * @return {string} the pattern name which should be unbound, othewise return null.
     */
    lessSub(consumerTag) {
        let subscriptions = this._subscriptions, matchingPattern = null;
        for (let sub of subscriptions) {
            if (!sub[1].has(consumerTag)) {
                continue;
            }
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
    parseMessage(raw) {
        return {
            raw,
            data: JSON.parse(raw.content.toJSON().data.toString()),
            correlationId: raw.properties.correlationId
        };
    }
};
TopicMessageBrokerAdapter = __decorate([
    DependencyContainer_1.injectable(),
    __param(0, DependencyContainer_1.inject(Types_1.Types.CONFIG_ADAPTER)),
    __metadata("design:paramtypes", [Object])
], TopicMessageBrokerAdapter);
exports.TopicMessageBrokerAdapter = TopicMessageBrokerAdapter;

//# sourceMappingURL=MessageBrokerAdapter.js.map
