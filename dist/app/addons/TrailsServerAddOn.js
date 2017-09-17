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
Object.defineProperty(exports, "__esModule", { value: true });
const TrailsApp = require("trails");
const back_lib_common_util_1 = require("back-lib-common-util");
const Types_1 = require("../constants/Types");
const app = require("../");
let TrailsServerAddOn = class TrailsServerAddOn {
    constructor(depContainer) {
        this._server = new TrailsApp(app);
        depContainer.bindConstant(Types_1.Types.TRAILS_APP, this._server);
    }
    get server() {
        return this._server;
    }
    /**
     * @see IServiceAddOn.init
     */
    init() {
        return this._server.start()
            .catch(err => this._server.stop(err));
    }
    /**
     * @see IServiceAddOn.deadLetter
     */
    deadLetter() {
        return Promise.resolve();
    }
    /**
     * @see IServiceAddOn.dispose
     */
    dispose() {
        return this._server.stop();
    }
};
TrailsServerAddOn = __decorate([
    back_lib_common_util_1.injectable(),
    __param(0, back_lib_common_util_1.inject(back_lib_common_util_1.Types.DEPENDENCY_CONTAINER)),
    __metadata("design:paramtypes", [Object])
], TrailsServerAddOn);
exports.TrailsServerAddOn = TrailsServerAddOn;

//# sourceMappingURL=TrailsServerAddOn.js.map
