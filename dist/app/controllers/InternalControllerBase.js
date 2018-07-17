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
var _a, _b;
"use strict";
const back_lib_common_contracts_1 = require("back-lib-common-contracts");
const back_lib_common_util_1 = require("back-lib-common-util");
const back_lib_id_generator_1 = require("back-lib-id-generator");
let InternalControllerBase = class InternalControllerBase {
    constructor(_ClassDTO, _repo, _idProvider) {
        this._ClassDTO = _ClassDTO;
        this._repo = _repo;
        this._idProvider = _idProvider;
    }
    get validator() {
        return this._ClassDTO['validator'];
    }
    get translator() {
        return this._ClassDTO['translator'];
    }
    async countAll(payload, resolve, reject, request) {
        console.log('Counting model');
        let count = await this._repo.countAll(payload.options);
        resolve(count);
    }
    async create(payload, resolve, reject, request) {
        console.log('Creating model');
        payload.model.id = payload.model.id || this._idProvider.nextBigInt().toString();
        let dto = this.translator.whole(payload.model);
        dto = await this._repo.create(dto, payload.options);
        resolve(dto);
    }
    async deleteHard(payload, resolve, reject, request) {
        console.log('Hard deleting model');
        let pk = this.validator.pk(payload.pk), nRows = await this._repo.deleteHard(pk, payload.options);
        resolve(nRows);
    }
    async deleteSoft(payload, resolve, reject, request) {
        console.log('Soft deleting model');
        let pk = this.validator.pk(payload.pk), nRows = await this._repo.deleteSoft(pk, payload.options);
        resolve(nRows);
    }
    async exists(payload, resolve, reject, request) {
        console.log('Checking existence');
        let gotIt = await this._repo.exists(payload.props, payload.options);
        resolve(gotIt);
    }
    async findByPk(payload, resolve, reject, request) {
        console.log('Finding model');
        let pk = this.validator.pk(payload.pk), foundDto = await this._repo.findByPk(pk, payload.options);
        resolve(foundDto);
    }
    async recover(payload, resolve, reject, request) {
        console.log('Recovering model');
        let pk = this.validator.pk(payload.pk), nRows = await this._repo.recover(pk, payload.options);
        resolve(nRows);
    }
    async page(payload, resolve, reject, request) {
        console.log('Paging model');
        let models = await this._repo.page(payload.pageIndex, payload.pageSize, payload.options);
        resolve(models);
    }
    async patch(payload, resolve, reject, request) {
        console.log('Patching model');
        let model = this.translator.partial(payload.model), updatedProps = await this._repo.patch(model, payload.options);
        resolve(updatedProps);
    }
    async update(payload, resolve, reject, request) {
        console.log('Updating model');
        let model = this.translator.whole(payload.model), updatedModel = await this._repo.update(model, payload.options);
        resolve(updatedModel);
    }
};
InternalControllerBase = __decorate([
    back_lib_common_util_1.injectable(),
    __param(0, back_lib_common_util_1.unmanaged()),
    __param(1, back_lib_common_util_1.unmanaged()),
    __param(2, back_lib_common_util_1.unmanaged()),
    __metadata("design:paramtypes", [Object, typeof (_a = typeof back_lib_common_contracts_1.ISoftDelRepository !== "undefined" && back_lib_common_contracts_1.ISoftDelRepository) === "function" && _a || Object, typeof (_b = typeof back_lib_id_generator_1.IdProvider !== "undefined" && back_lib_id_generator_1.IdProvider) === "function" && _b || Object])
], InternalControllerBase);
exports.InternalControllerBase = InternalControllerBase;
//# sourceMappingURL=InternalControllerBase.js.map