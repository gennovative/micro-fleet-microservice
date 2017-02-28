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
	baseUrl: string;
}

@injectable()
export class DirectRpcCaller
			extends rpc.RpcCallerBase
			implements IDirectRpcCaller {

	private _baseUrl: string;
	private _requestMaker: (options) => Promise<any>;

	constructor() {
		super();
		this._requestMaker = request;
	}

	public get baseUrl(): string {
		return this._baseUrl;
	}

	public set baseUrl(val: string) {
		this._baseUrl = val;
	}

	public call(moduleName: string, action: string, params: any): Promise<rpc.IRpcResponse> {
		Guard.assertDefined('moduleName', moduleName);
		Guard.assertDefined('action', action);
		Guard.assertIsTruthy(this._baseUrl, 'Base URL must be set!');

		return new Promise<rpc.IRpcResponse>((resolve, reject) => {
			let request: rpc.IRpcRequest = {
				from: this._name,
				to: moduleName,
				params
			},
				options = {
				method: 'POST',
				uri: `http://${this._baseUrl}/${moduleName}/${action}`,
				body: request,
				json: true // Automatically stringifies the body to JSON
			};

			return this._requestMaker(options);
		});
	}
}