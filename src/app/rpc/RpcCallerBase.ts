import { IRpcRequest, IRpcResponse } from './RpcModels';

export interface IRpcCaller {
	/**
	 * A name used in "from" and "to" request property.
	 */
	name: string;

	/**
	 * Listens to `route`, resolves an instance with `dependencyIdentifier`
	 * when there is a request coming, calls instance's `action` method. If `actions`
	 * is not specified, RPC Caller tries to figure out an action method from `route`.
	 */
	call(moduleName: string, action: string, param: any): Promise<IRpcResponse>;
}

export abstract class RpcCallerBase {

	protected _name: string;

	public get name(): string {
		return this._name;
	}

	public set name(val: string) {
		this._name = val;
	}
}