import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as ex from '../microservice/Exceptions';
import { Guard } from '../utils/Guard';
import { Types as T } from '../constants/Types';
import { injectable, inject, IDependencyContainer } from '../utils/DependencyContainer';
import * as rpc from './RpcCommon';

export interface IDirectRpcHandler extends rpc.IRpcHandler {
}

@injectable()
export class ExpressDirectRpcHandler
			extends rpc.RpcHandlerBase
			implements IDirectRpcHandler {

	private static URL_TESTER: RegExp = (function() {
			let regexp = new RegExp(/^[a-zA-Z0-9_-]*$/);
			regexp.compile();
			return regexp;
		})();

	private _app: express.Express;
	private _router: express.Router;


	constructor(
		@inject(T.DEPENDENCY_CONTAINER) depContainer: IDependencyContainer
	) {
		super(depContainer);
	}


	public init(param: any): void {
		Guard.assertIsFalsey(this._router, 'This RPC Caller is already initialized!');
		Guard.assertIsTruthy(this._name, '`name` property must be set!');
		Guard.assertIsTruthy(param.expressApp, '`expressApp` with an instance of Express is required!');
		Guard.assertIsTruthy(param.router, '`router` with an instance of Express Router is required!');

		let app: express.Express = this._app = param.expressApp;
		
		this._router = param.router;
		//app.use(bodyParser.urlencoded({extended: true})); // Parse Form values in POST request, but I don't think we need it in this case.
		app.use(bodyParser.json()); // Parse JSON in POST request
		app.use(`/${this._name}`, this._router);
	}

	public handle(action: string, dependencyIdentifier: string | symbol, actionFactory?: rpc.RpcActionFactory) {
		Guard.assertIsMatch(null, ExpressDirectRpcHandler.URL_TESTER, action, `Route "${action}" is not URL-safe!`);
		Guard.assertIsTruthy(this._router, '`init` method must be called first!');

		this._router.post(`/${action}`, this.buildHandleFunc.apply(this, arguments));
	}


	private buildHandleFunc(action: string, dependencyIdentifier: string | symbol, actionFactory?: rpc.RpcActionFactory): express.RequestHandler {
		return (req: express.Request, res: express.Response) => {
			let request: rpc.IRpcRequest = req.body;

			(new Promise((resolve, reject) => {
				let actionFn = this.resolveActionFunc(action, dependencyIdentifier, actionFactory);
				// Execute controller's action
				actionFn(request, resolve, reject);
			}))
			.then(result => {
				res.status(200).send(this.createResponse(true, result, request.from));
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

				// If this is a reject error, which means the action method sends this error
				// back to caller on purpose.
				res.status(statusCode).send(this.createResponse(false, errMsg, request.from));
			});
		};
	}
}