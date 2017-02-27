import { EventEmitter } from 'events';

import * as uuid from 'uuid';
import * as request from 'request-promise';

import * as ex from '../microservice/Exceptions';
import { Guard } from '../utils/Guard';
import { Types as T } from '../constants/Types';
import { injectable, inject, IDependencyContainer } from '../utils/DependencyContainer';
import { IMessageBrokerAdapter, MessageHandleFunction, IMessage } from '../adapters/MessageBrokerAdapter';
import { RpcCallerBase, IRpcCaller } from './RpcCallerBase';
import { IRpcRequest, IRpcResponse } from './RpcModels';


export interface IHttpRpcCaller extends IRpcCaller {
	baseUrl: string;
}

@injectable()
export class HttpRpcCaller
			extends RpcCallerBase
			implements IHttpRpcCaller {

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

	public call(moduleName: string, action: string, param: any): Promise<IRpcResponse> {
		Guard.assertDefined('moduleName', moduleName);
		Guard.assertDefined('action', action);
		Guard.assertIsTruthy(this._baseUrl, 'Base URL must be set!');

		return new Promise<IRpcResponse>((resolve, reject) => {
			let options = {
				method: 'POST',
				uri: `${this._baseUrl}/${moduleName}/${action}`,
				body: param,
				json: true // Automatically stringifies the body to JSON
			};

			return this._requestMaker(options);
		});
	}
}