import * as request from 'request-promise';
import { IAdapter } from './IAdapter';
import { injectable } from '../utils/DependencyContainer';
import { SettingKeys as S } from '../constants/SettingKeys';

export interface IConfigurationAdapter extends IAdapter {
	enableRemote: boolean;
	get(key: string): string;
	fetch(): Promise<boolean>;
}

/**
 * Provides settings from package
 */
@injectable()
export class ConfigurationAdapter implements IConfigurationAdapter {
	private _configFilePath = `${process.cwd()}/appconfig.json`;
	private _fileSettings;
	private _requestMaker;
	private _remoteSettings;
	private _enableRemote: boolean;

	constructor() {
		this._remoteSettings = {};
		this._requestMaker = request;
		this._enableRemote = false;
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
		let serviceName = this.get(S.SERVICE_NAME),
			options = {
				uri: address,
				qs: {
					name: serviceName // -> uri + '?name=xxxxx'
				},
				json: true // Automatically parses the JSON string in the response
			};

		try {
			let json = await this._requestMaker(options);
			if (json.success) {
				this._remoteSettings = json.settings;
				return true;
			}
		} catch (err) {
			// TODO: Writing logs
		}
		return false;
	}
}