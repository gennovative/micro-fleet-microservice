import { EventEmitter } from 'events';

import * as uuid from 'uuid';
import * as request from 'request-promise';

import * as ex from '../microservice/Exceptions';
import { Guard } from '../utils/Guard';
import { Types as T } from '../constants/Types';
import { injectable, inject, IDependencyContainer } from '../utils/DependencyContainer';
import { IMessageBrokerAdapter, MessageHandleFunction, IMessage } from '../adapters/MessageBrokerAdapter';
import * as rpc from './RpcCommon';


export interface IDirectRpcCaller extends rpc.IRpcCaller {
	/**
	 * IP address or host name including port number.
	 * Do not include protocol (http, ftp...) because different class implementations
	 * will prepend different protocols.
	 */
	baseAddress: string;
}

@injectable()
export class HttpRpcCaller
			extends rpc.RpcCallerBase
			implements IDirectRpcCaller {

	private _baseAddress: string;
	private _requestMaker: (options) => Promise<any>;

	constructor() {
		super();
		this._requestMaker = request;
	}

	public get baseAddress(): string {
		return this._baseAddress;
	}

	public set baseAddress(val: string) {
		this._baseAddress = val;
	}

	public init(param: any): void {
	}

	public call(moduleName: string, action: string, params: any): Promise<rpc.IRpcResponse> {
		Guard.assertDefined('moduleName', moduleName);
		Guard.assertDefined('action', action);
		Guard.assertIsTruthy(this._baseAddress, 'Base URL must be set!');

		return new Promise<rpc.IRpcResponse>((resolve, reject) => {
			let request: rpc.IRpcRequest = {
				from: this._name,
				to: moduleName,
				params
			},
				options = {
				method: 'POST',
				uri: `http://${this._baseAddress}/${moduleName}/${action}`,
				body: request,
				json: true // Automatically stringifies the body to JSON
			};

			return this._requestMaker(options)
				.catch(rawResponse => {
					return <rpc.IRpcResponse>rawResponse.error;
				});
		});
	}
}