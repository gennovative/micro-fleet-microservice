"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const Guard_1 = require("../utils/Guard");
class RepositoryBase {
    constructor(_modelMapper) {
        this._modelMapper = _modelMapper;
        Guard_1.Guard.assertDefined('modelMapper', this._modelMapper);
        this.createModelMap();
    }
    create(model) {
        return __awaiter(this, void 0, void 0, function* () {
            let newEnt = yield this.query().insert(model);
            return this.toDTO(newEnt);
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let affectedRows = yield this.query().deleteById(id);
            return affectedRows;
        });
    }
    find(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let foundEnt = yield this.query().findById(id);
            return this.toDTO(foundEnt);
        });
    }
    patch(model) {
        return __awaiter(this, void 0, void 0, function* () {
            Guard_1.Guard.assertDefined('entity.id', model.id);
            let affectedRows = yield this.query().where('id', model.id).patch(model);
            return affectedRows;
        });
    }
    update(model) {
        return __awaiter(this, void 0, void 0, function* () {
            Guard_1.Guard.assertDefined('entity.id', model.id);
            let affectedRows = yield this.query().where('id', model.id).update(model);
            return affectedRows;
        });
    }
}
exports.RepositoryBase = RepositoryBase;

//# sourceMappingURL=RepositoryBase.js.map
