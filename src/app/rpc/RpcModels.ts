import * as express from 'express-serve-static-core';
import { CriticalException } from '../microservice/Exceptions';
import { IMessage } from '../adapters/MessageBrokerAdapter';


export interface IRpcRequest {
	from: string;
	to: string;
	param: any;
}

export interface IRpcResponse {
	isSuccess: boolean;
	from: string;
	to: string;
	data: any;
}