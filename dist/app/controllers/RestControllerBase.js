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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const inversify_1 = require("inversify");
const TrailsApp = require("trails");
const TrailsController = require("trails-controller");
const back_lib_common_util_1 = require("back-lib-common-util");
const back_lib_id_generator_1 = require("back-lib-id-generator");
inversify_1.decorate(back_lib_common_util_1.injectable(), TrailsController);
let RestControllerBase = class RestControllerBase extends TrailsController {
    constructor(trailsApp, _ClassDTO, _repo, _idProvider) {
        super(trailsApp);
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
    countAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Counting model');
            let payload = req.body();
            try {
                let nRows = yield this._repo.countAll(payload.options);
                this.reply(nRows, res);
            }
            catch (err) {
                this.internalError(err, res);
            }
        });
    }
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Creating model');
            let payload = req.body(), dto = this.translator.whole(payload.model, {
                errorCallback: err => this.validationError(err, res)
            });
            if (!dto) {
                return;
            }
            try {
                dto = yield this._repo.create(dto, payload.options);
                this.reply(dto, res);
            }
            catch (err) {
                this.internalError(err, res);
            }
        });
    }
    deleteHard(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Hard deleting model');
            let payload = req.body(), [err, pk] = this.validator.pk(payload.pk);
            if (!err) {
                this.validationError(err, res);
                return;
            }
            try {
                let nRows = yield this._repo.deleteHard(pk, payload.options);
                this.reply(nRows, res);
            }
            catch (err) {
                this.internalError(err, res);
            }
        });
    }
    deleteSoft(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Soft deleting model');
            let payload = req.body(), [err, pk] = this.validator.pk(payload.pk);
            if (!err) {
                this.validationError(err, res);
                return;
            }
            try {
                let nRows = yield this._repo.deleteSoft(pk, payload.options);
                this.reply(nRows, res);
            }
            catch (err) {
                this.internalError(err, res);
            }
        });
    }
    exists(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Checking existence');
            let payload = req.body();
            try {
                let gotIt = yield this._repo.exists(payload.props, payload.options);
                this.reply(gotIt, res);
            }
            catch (err) {
                this.internalError(err, res);
            }
        });
    }
    findByPk(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Finding model');
            let payload = req.body(), [err, pk] = this.validator.pk(payload.pk);
            if (!err) {
                this.validationError(err, res);
                return;
            }
            try {
                let dto = yield this._repo.findByPk(pk, payload.options);
                this.reply(dto, res);
            }
            catch (err) {
                this.internalError(err, res);
            }
        });
    }
    recover(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Recovering model');
            let payload = req.body(), [err, pk] = this.validator.pk(payload.pk);
            if (!err) {
                this.validationError(err, res);
                return;
            }
            try {
                let nRows = yield this._repo.recover(pk, payload.options);
                this.reply(nRows, res);
            }
            catch (err) {
                this.internalError(err, res);
            }
        });
    }
    page(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Paging model');
            let payload = req.body();
            try {
                let models = yield this._repo.page(payload.pageIndex, payload.pageSize, payload.options);
                this.reply(models, res);
            }
            catch (err) {
                this.internalError(err, res);
            }
        });
    }
    patch(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Patching model');
            let payload = req.body(), model = this.translator.partial(payload.model, {
                errorCallback: err => this.validationError(err, res)
            });
            if (!model) {
                return;
            }
            try {
                let updatedProps = yield this._repo.patch(model, payload.options);
                this.reply(updatedProps, res);
            }
            catch (err) {
                this.internalError(err, res);
            }
        });
    }
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Updating model');
            let payload = req.body(), model = this.translator.whole(payload.model, {
                errorCallback: err => this.validationError(err, res)
            });
            if (!model) {
                return;
            }
            try {
                let updatedModel = yield this._repo.update(model, payload.options);
                this.reply(updatedModel, res);
            }
            catch (err) {
                this.internalError(err, res);
            }
        });
    }
    validationError(err, res) {
        super.log.error(err);
        res.status(412).send(err); // Precondition Failed
    }
    internalError(err, res) {
        super.log.error(err);
        res.status(500).send('server.error.internal');
    }
    reply(result, res) {
        res.status(200).send(result);
    }
};
RestControllerBase = __decorate([
    back_lib_common_util_1.injectable(),
    __metadata("design:paramtypes", [typeof (_a = typeof TrailsApp !== "undefined" && TrailsApp) === "function" && _a || Object, Object, Object, back_lib_id_generator_1.IdProvider])
], RestControllerBase);
exports.RestControllerBase = RestControllerBase;
var _a;

//# sourceMappingURL=RestControllerBase.js.map
