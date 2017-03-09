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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const knex = require("knex");
const objection_1 = require("objection");
const back_lib_common_util_1 = require("back-lib-common-util");
const SettingKeys_1 = require("../constants/SettingKeys");
const Types_1 = require("../constants/Types");
/**
 * Db driver names for `IDatabaseAdapter.clientName` property.
 */
class DbClient {
}
/**
 * Microsoft SQL Server
 */
DbClient.MSSQL = 'mssql';
/**
 * MySQL
 */
DbClient.MYSQL = 'mysql';
/**
 * PostgreSQL
 */
DbClient.POSTGRESQL = 'pg';
/**
 * SQLite 3
 */
DbClient.SQLITE3 = 'sqlite3';
exports.DbClient = DbClient;
/**
 * Provides settings from package
 */
let KnexDatabaseAdapter = class KnexDatabaseAdapter {
    constructor(_configProvider) {
        this._configProvider = _configProvider;
        this._clientName = DbClient.POSTGRESQL;
        this._knex = knex;
    }
    get clientName() {
        return this._clientName;
    }
    set clientName(value) {
        this._clientName = value;
    }
    init() {
        return new Promise(resolve => {
            let cfgAdt = this._configProvider, settings = {
                client: this._clientName,
                useNullAsDefault: true,
                connection: this.buildConnSettings()
            }, k = this._knex(settings);
            objection_1.Model.knex(k);
            resolve();
        });
    }
    dispose() {
        return __awaiter(this, void 0, void 0, function* () {
            // Casting from Bluebird Promise to Node native Promise
            // This cast is for compiler, hence no effect to runtime performance.
            yield objection_1.Model.knex().destroy();
            this._configProvider = null;
            this._knex = null;
            this._clientName = null;
        });
    }
    buildConnSettings() {
        let cfgAdt = this._configProvider, value;
        // 1st priority: connect to a local file.
        value = cfgAdt.get(SettingKeys_1.SettingKeys.DB_FILE);
        if (value && value.length) {
            return { filename: value };
        }
        // 2nd priority: connect with a connection string.
        value = cfgAdt.get(SettingKeys_1.SettingKeys.DB_CONN_STRING);
        if (value && value.length) {
            return value;
        }
        // Last priority: connect with host credentials.
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
    back_lib_common_util_1.injectable(),
    __param(0, back_lib_common_util_1.inject(Types_1.Types.CONFIG_PROVIDER)),
    __metadata("design:paramtypes", [Object])
], KnexDatabaseAdapter);
exports.KnexDatabaseAdapter = KnexDatabaseAdapter;

//# sourceMappingURL=DatabaseAdapter.js.map
