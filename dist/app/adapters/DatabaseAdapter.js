"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
const knex = require("knex");
const objection_1 = require("objection");
const DependencyContainer_1 = require("../utils/DependencyContainer");
const SettingKeys_1 = require("../constants/SettingKeys");
const Types_1 = require("../constants/Types");
let KnexDatabaseAdapter = class KnexDatabaseAdapter {
    constructor(_configAdapter) {
        this._configAdapter = _configAdapter;
        this._clientName = 'pg';
        this._knex = knex;
    }
    get clientName() {
        return this._clientName;
    }
    set clientName(value) {
        this._clientName = value;
    }
    init() {
        let cfgAdt = this._configAdapter, settings = {
            client: this._clientName,
            useNullAsDefault: true,
            connection: this.buildConnSettings()
        }, k = this._knex(settings);
        objection_1.Model.knex(k);
        return Promise.resolve(true);
    }
    destroy() {
        return (objection_1.Model.knex().destroy());
    }
    buildConnSettings() {
        let cfgAdt = this._configAdapter, value;
        value = cfgAdt.get(SettingKeys_1.SettingKeys.DB_FILE);
        if (value && value.length) {
            return { filename: value };
        }
        value = cfgAdt.get(SettingKeys_1.SettingKeys.DB_CONN_STRING);
        if (value && value.length) {
            return value;
        }
        value = cfgAdt.get(SettingKeys_1.SettingKeys.DB_HOST);
        if (value && value.length) {
            return {
                host: cfgAdt.get(SettingKeys_1.SettingKeys.DB_HOST),
                user: cfgAdt.get(SettingKeys_1.SettingKeys.DB_USER),
                password: cfgAdt.get(SettingKeys_1.SettingKeys.DB_PASSWORD),
                database: cfgAdt.get(SettingKeys_1.SettingKeys.DB_NAME),
            };
        }
        throw 'No database settings!';
    }
};
KnexDatabaseAdapter = __decorate([
    DependencyContainer_1.injectable(),
    __param(0, DependencyContainer_1.inject(Types_1.Types.CONFIG_ADAPTER)),
    __metadata("design:paramtypes", [Object])
], KnexDatabaseAdapter);
exports.KnexDatabaseAdapter = KnexDatabaseAdapter;

//# sourceMappingURL=DatabaseAdapter.js.map
