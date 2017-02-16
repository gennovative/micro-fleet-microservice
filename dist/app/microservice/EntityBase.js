"use strict";
const objection_1 = require("objection");
class EntityBase extends objection_1.Model {
    static get tableName() {
        throw 'This method must be implemented by derived class!';
    }
}
exports.EntityBase = EntityBase;

//# sourceMappingURL=EntityBase.js.map
