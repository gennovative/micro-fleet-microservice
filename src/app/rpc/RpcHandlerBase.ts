import { Guard } from '../utils/Guard';
import { IDependencyContainer } from '../utils/DependencyContainer';
import { IRpcRequest, IRpcResponse } from './RpcModels';

// Based on ES6 native Promise definition
export type PromiseResolveFn = (value?: any | PromiseLike<any>) => void;
export type PromiseRejectFn = (reason?: any) => void;

export type RpcControllerFunction = (request: IRpcRequest, resolve: PromiseResolveFn, reject: PromiseRejectFn) => void;
export type RpcActionFactory = (controller) => RpcControllerFunction;

export interface IRpcHandler {
	/**
	 * A name used in "from" and "to" request property.
	 */
	name: string;

	/**
	 * Waits for incoming request, resolves an instance with `dependencyIdentifier`,
	 * calls instance's `action` method. If `customAction` is specified, 
	 * calls instance's `customAction` instead.
	 */
	handle(action: string, dependencyIdentifier: string | symbol, actionFactory?: RpcActionFactory);
}

export abstract class RpcHandlerBase {

	protected _name: string;

	public get name(): string {
		return this._name;
	}

	public set name(val: string) {
		this._name = val;
	}

	constructor(protected _depContainer: IDependencyContainer) {
	}
	

	protected resolveActionFunc(action: string, depId: string | symbol, actFactory?: RpcActionFactory): RpcControllerFunction {
		// Attempt to resolve controller instance
		let instance = this._depContainer.resolve<any>(depId);
		Guard.assertIsTruthy(instance, `Cannot resolve dependency ${depId}!`);

		let actionFn = (action ? instance[action] : null);
		
		// If default action is not available, attempt to get action from factory.
		if (!actionFn) {
			actionFn = (actFactory ? actFactory(instance) : null);
		}

		Guard.assertIsTruthy(instance, `Specified action does not exist!`);

		return actionFn.bind(instance);
	}

	protected createResponse(isSuccess, data, replyTo: string): IRpcResponse {
		return {
			isSuccess,
			from: this._name,
			to: replyTo,
			data
		};
	}
}
