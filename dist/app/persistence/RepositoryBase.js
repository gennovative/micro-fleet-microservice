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
const DependencyContainer_1 = require("../utils/DependencyContainer");
const Guard_1 = require("../utils/Guard");
let RepositoryBase = class RepositoryBase {
    constructor(_modelMapper) {
        this._modelMapper = _modelMapper;
        Guard_1.Guard.assertDefined('modelMapper', this._modelMapper);
        this.createModelMap();
    }
    countAll() {
        return __awaiter(this, void 0, void 0, function* () {
            let count = yield this.query().count('id');
            // In case with Postgres, `count` returns a bigint type which will be a String 
            // and not a Number.
            return (count * 1);
        });
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
    page(pageIndex, pageSize) {
        return __awaiter(this, void 0, void 0, function* () {
            let foundList = yield this.query().page(pageIndex, pageSize);
            return this.toDTO(foundList);
        });
    }
    update(model) {
        return __awaiter(this, void 0, void 0, function* () {
            Guard_1.Guard.assertDefined('entity.id', model.id);
            let affectedRows = yield this.query().where('id', model.id).update(model);
            return affectedRows;
        });
    }
};
RepositoryBase = __decorate([
    DependencyContainer_1.injectable(),
    __metadata("design:paramtypes", [Object])
], RepositoryBase);
exports.RepositoryBase = RepositoryBase;

//# sourceMappingURL=RepositoryBase.js.map
