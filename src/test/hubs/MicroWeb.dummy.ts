import * as core from 'express-serve-static-core';
import { IMicroWeb } from '../../app/hubs/ExpressHub';

class MicroWeb implements IMicroWeb {
	get name(): string {
		return 'dummy';
	}

	public initRoute(router: core.IRouter): void {
		router.get('/', (req, res) => {
			res.json({ success: true });
		});
	}
}

export = new MicroWeb();