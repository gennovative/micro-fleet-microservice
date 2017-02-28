import * as request from 'request-promise';
import { inject, injectable } from '../utils/DependencyContainer';
import * as rdc from '../rpc/DirectRpcCaller';
import * as rcm from '../rpc/RpcCommon';
import { SettingKeys as S } from '../constants/SettingKeys';
import { Types as T } from '../constants/Types';

export interface IConfigurationProvider extends IAdapter {
	enableRemote: boolean;
	get(key: string): string;
	fetch(): Promise<boolean>;
}

/**
 * Provides settings from package
 */
@injectable()
export class ConfigurationProvider implements IConfigurationProvider {
	private _configFilePath = `${process.cwd()}/appconfig.json`;
	private _fileSettings;
	private _requestMaker;
	private _remoteSettings;
	private _enableRemote: boolean;

	constructor(
		@inject(T.DIRECT_RPC_CALLER) private _rpcCaller: rdc.IDirectRpcCaller
	) {
		this._remoteSettings = {};
		this._requestMaker = request;
		this._enableRemote = false;
		if (this._rpcCaller) {
			this._rpcCaller.name = 'ConfigurationProvider';
		}
	}

	public get enableRemote(): boolean {
		return this._enableRemote;
	}

	public set enableRemote(value: boolean) {
		this._enableRemote = value;
	}

	public init(): Promise<void> {
		return new Promise<void>(resolve => {
			try {
				this._fileSettings = require(this._configFilePath);
			} catch (ex) {
				this._fileSettings = {};
			}
			resolve();
		});
	}

	public dispose(): Promise<void> {
		return new Promise<void>(resolve => {
			this._configFilePath = null;
			this._fileSettings = null;
			this._remoteSettings = null;
			this._requestMaker = null;
			this._enableRemote = null;
			this._rpcCaller = null;
			resolve();
		});
	}

	/**
	 * Attempts to get settings from cached Configuration Service, environmetal variable,
	 * and `appconfig.json` file, respectedly.
	 */
	public get(key: string): string {
		let value = (this._remoteSettings[key] || process.env[key] || this._fileSettings[key]);
		return (value ? value : null);
	}

	/**
	 * Attempts to fetch settings from remote Configuration Service.
	 */
	public async fetch(): Promise<boolean> {
		let addressRaw = this.get(S.CONFIG_SERVICE_ADDRESSES);

		if (!addressRaw || !addressRaw.length) { throw 'No address for Configuration Service!'; }

		let addressList: string[] = addressRaw.split(';'),
			i = 0;
		for (; i < addressList.length; i++) {
			if (await this.attemptFetch(addressList[i])) {
				// Stop trying if success
				return true;
			}
		}

		throw 'Cannot connect to any address of Configuration Service!';
	}


	private async attemptFetch(address: string): Promise<boolean> {
		let serviceName = this.get(S.SERVICE_NAME);

		try {
			this._rpcCaller.baseUrl = address;
			let res: rcm.IRpcResponse = await this._rpcCaller.call('ConfigurationSvc', 'instance', {
				name: serviceName
			});
			if (res.isSuccess) {
				this._remoteSettings = res.data;
				return true;
			}
		} catch (err) {
			// TODO: Writing logs
		}
		return false;
	}
}