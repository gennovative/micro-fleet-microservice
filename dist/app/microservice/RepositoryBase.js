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
    create(ent) {
        return __awaiter(this, void 0, void 0, function* () {
            let newEnt = yield this.query().insert(ent);
            return newEnt;
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
            return foundEnt;
        });
    }
    patch(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            Guard_1.Guard.assertDefined('entity.id', entity.id);
            let affectedRows = yield this.query().where('id', entity.id).patch(entity);
            return affectedRows;
        });
    }
    update(entity) {
        return __awaiter(this, void 0, void 0, function* () {
            Guard_1.Guard.assertDefined('entity.id', entity.id);
            let affectedRows = yield this.query().where('id', entity.id).update(entity);
            return affectedRows;
        });
    }
}
exports.RepositoryBase = RepositoryBase;

//# sourceMappingURL=RepositoryBase.js.map
