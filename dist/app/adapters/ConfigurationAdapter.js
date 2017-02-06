"use strict";
class ConfigurationAdapter {
    constructor() {
        this._staticSettings = require(`${process.cwd()}/appconfig.json`);
    }
    get(key) {
        return this._staticSettings[key];
    }
}
exports.ConfigurationAdapter = ConfigurationAdapter;

//# sourceMappingURL=ConfigurationAdapter.js.map
