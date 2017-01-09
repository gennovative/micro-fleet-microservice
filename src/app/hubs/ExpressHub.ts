import * as core from 'express-serve-static-core';
import * as http from 'http';
const express = require('express');
import * as assert from 'assert';

export interface IMicroWeb {
	name: string;
	initRoute(router: core.IRouter): void;
}

/**
 * A central point that allows micro web services to register their routes.
 */
export class ExpressHub {
	private _app: core.Express;

	constructor() {
		this._app = express();
	}

	/**
	 * Registers a micro web to serve under path "/{web name}/{web routes}".
	 */
	public use(microWeb: IMicroWeb): ExpressHub {
		assert.notEqual(microWeb, null, 'Argument "plugin" is required.');

		let r = express.Router();
		this._app.use(`/${microWeb.name}`, r);
		microWeb.initRoute(r);
		return this;
	}

	/**
	 * Starts HTTP server.
	 */
	public listen(port: number = 3000, callback?: Function): http.Server {
		let server = this._app.listen(port, (err) => {
			callback(err, server);
		});
		return server;
	}
}