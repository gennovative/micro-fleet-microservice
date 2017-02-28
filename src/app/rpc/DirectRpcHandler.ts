/// <reference types="express-serve-static-core" />

import * as ex from '../microservice/Exceptions';
//import * as exCore from 'express-serve-static-core';
import * as express from 'express';
import { Guard } from '../utils/Guard';
import { Types as T } from '../constants/Types';
import { injectable, inject, IDependencyContainer } from '../utils/DependencyContainer';
import * as rpc from './RpcCommon';

export interface IDirectRpcHandler extends rpc.IRpcHandler {
	express: express.Express;
}

@injectable()
export class ExpressRpcHandler
			extends rpc.RpcHandlerBase
			implements IDirectRpcHandler {

	private readonly _urlSafe: RegExp = /^[a-zA-Z0-9_-]*$/.compile();
	private _router: express.Router;
	private _express: express.Express;


	public set express(val: express.Express) {
		Guard.assertIsFalsey(this._router, 'Another Express instance is already set.');

		this._express = val;
		this.initRouter();
	}


	constructor(
		@inject(T.DEPENDENCY_CONTAINER) depContainer: IDependencyContainer
	) {
		super(depContainer);
	}


	public handle(action: string, dependencyIdentifier: string | symbol, actionFactory?: rpc.RpcActionFactory) {
		Guard.assertIsMatch(null, this._urlSafe, action, `Route "${action}" is not URL-safe!`);
		Guard.assertIsTruthy(this._router, 'Router must be set!');

		let actionFn = this.resolveActionFunc(action, dependencyIdentifier, actionFactory);
		this._router.post(`/${action}`, this.buildHandleFunc(actionFn));
	}


	private initRouter() {
		Guard.assertIsTruthy(this._name, 'Name must be set before setting Express.');
		
		this._router = express.Router();
		this._express.use(`/${this._name}`, this._router);
	}

	private buildHandleFunc(actionFn: rpc.RpcControllerFunction): express.RequestHandler {
		return (req: express.Request, res: express.Response) => {
			let request: rpc.IRpcRequest = req.body;

			(new Promise((resolve, reject) => {
				// Execute controller's action
				actionFn(request, resolve, reject);
			}))
			.then(result => {
				res.send(200, this.createResponse(true, result, request.from));
			})
			.catch(error => {
				let errMsg = error,
					statusCode = 200;

				// If error is an uncaught Exception object, that means the action method
				// has a problem. We should response with error status code.
				if (error instanceof ex.Exception) {
					// TODO: Should log this unexpected error.
					statusCode = 500;
					errMsg = error.message;
				}

				// If this is a custom error, which means the action method sends this error
				// back to caller on purpose.
				res.send(statusCode, this.createResponse(false, errMsg, request.from));
			});
		};
	}
}