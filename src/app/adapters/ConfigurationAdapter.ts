import request from 'request-promise';
const SettingKeys = require('../constants/SettingKeys');

/**
 * Provides settings from package
 */
export class ConfigurationAdapter {
	private _configFilePath = `${process.cwd()}/appconfig.json`;
	private _startupPath: string;
	private _staticSettings;
	private _requestMaker;
	private _settings;

	constructor(requestMaker?) {
		this._staticSettings = require(this._configFilePath);
		this._requestMaker = requestMaker || request;
		this._settings = {};
	}
	
	/**
	 * Attempts to get settings from environmetal variable, `appconfig.json` file,
	 * or from cached Configuration Service.
	 */
	public get(key: string): string {
		return this._settings[key] || process.env[key] || this._staticSettings[key];
	}

	/**
	 * Attempts to fetch settings from remote Configuration Service.
	 */
	public async fetch(): Promise<boolean> {
		let addressRaw = this.get(SettingKeys.CONFIG_SERVICE_ADDRESSES);

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
		let serviceName = this.get(SettingKeys.SERVICE_NAME),
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
				this._settings = json.settings;
			}
			return true;
		} catch (err) {
			return false;
		}
	}
}