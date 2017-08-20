import { DbClient } from 'back-lib-persistence';

export default {
	clientName: DbClient.POSTGRESQL,
	host: {
		address: 'localhost',
		user: 'postgres',
		password: 'postgres',
		database: 'unittest'
	}
};