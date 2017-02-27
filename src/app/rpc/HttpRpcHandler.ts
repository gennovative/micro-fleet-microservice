import * as ex from '../microservice/Exceptions';
import * as express from 'express-serve-static-core';
import { Guard } from '../utils/Guard';
import { Types as T } from '../constants/Types';
import { injectable, inject, IDependencyContainer } from '../utils/DependencyContainer';
import { RpcHandlerBase, IRpcHandler, RpcActionFactory, RpcControllerFunction } from './RpcHandlerBase';
import { IRpcRequest } from './RpcModels';

export interface IHttpRpcHandler extends IRpcHandler {
	router: express.IRouter;
}

@injectable()
export class ExpressRpcHandler
			extends RpcHandlerBase
			implements IHttpRpcHandler {

	private readonly _urlSafe: RegExp = /^[a-zA-Z0-9_-]*$/.compile();
	private _router: express.IRouter;

	public get router(): express.IRouter {
		return this._router;
	}

	public set router(val: express.IRouter) {
		this._router = val;
	}

	constructor(
		@inject(T.DEPENDENCY_CONTAINER) depContainer: IDependencyContainer
	) {
		super(depContainer);
	}


	public handle(action: string, dependencyIdentifier: string | symbol, actionFactory?: RpcActionFactory) {
		Guard.assertIsMatch(null, this._urlSafe, action, `Route "${action}" is not URL-safe!`);
		Guard.assertIsTruthy(this._router, 'Router must be set!');

		let actionFn = this.resolveActionFunc(action, dependencyIdentifier, actionFactory);
		this._router.post(`/${action}`, this.buildHandleFunc(actionFn));
	}

	private buildHandleFunc(actionFn: RpcControllerFunction): express.RequestHandler {
		return (req: express.Request, res: express.Response) => {
			let request: IRpcRequest = {
				from: req.body.from,
				to: req.body.to,
				param: req.body
			};

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