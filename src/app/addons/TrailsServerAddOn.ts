import TrailsApp = require('trails');
import { injectable, inject, IDependencyContainer, Types as CmT } from 'back-lib-common-util';
import { Types as T } from '../constants/Types';

import app = require('../');


@injectable()
export class TrailsServerAddOn implements IServiceAddOn {

	private _server: TrailsApp;


	constructor(
		@inject(CmT.DEPENDENCY_CONTAINER) depContainer: IDependencyContainer
	) {
		this._server = new TrailsApp(app);
		depContainer.bindConstant(T.TRAILS_APP, this._server);
	}


	get server(): TrailsApp {
		return this._server;
	}

	/**
	 * @see IServiceAddOn.init
	 */
	init(): Promise<void> {
		return <any>this._server.start()
			.catch(err => this._server.stop(err));
	}

	/**
	 * @see IServiceAddOn.deadLetter
	 */
	deadLetter(): Promise<void> {
		return Promise.resolve();
	}

	/**
	 * @see IServiceAddOn.dispose
	 */
	dispose(): Promise<void> {
		return <any>this._server.stop();
	}
}