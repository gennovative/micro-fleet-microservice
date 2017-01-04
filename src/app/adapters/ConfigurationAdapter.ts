/**
 * Provides settings from package
 */
export class ConfigurationAdapter {
	private _startupPath: string;
	private _staticSettings;
	
	constructor() {
		this._staticSettings = require(`${process.cwd()}/appconfig.json`);
	}
	
	public get(key: string): string {
		return this._staticSettings[key];
	}
}