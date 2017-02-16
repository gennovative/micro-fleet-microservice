"use strict";
const express = require('express');
const assert = require("assert");
class ExpressHub {
    constructor() {
        this._app = express();
    }
    use(microWeb) {
        assert.notEqual(microWeb, null, 'Argument "plugin" is required.');
        let r = express.Router();
        this._app.use(`/${microWeb.name}`, r);
        microWeb.initRoute(r);
        return this;
    }
    listen(port = 3000, callback) {
        let server = this._app.listen(port, (err) => {
            callback(err, server);
        });
        return server;
    }
}
exports.ExpressHub = ExpressHub;

//# sourceMappingURL=ExpressHub.js.map
