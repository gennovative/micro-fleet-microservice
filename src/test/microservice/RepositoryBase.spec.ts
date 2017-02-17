import { expect } from 'chai';
import { Model, QueryBuilder } from 'objection';

import { RepositoryBase, EntityBase, InvalidArgumentException,
	IConfigurationAdapter, IDatabaseAdapter, KnexDatabaseAdapter,
	SettingKeys as S } from '../../app';

const CONN_FILE = `${process.cwd()}/database-adapter-test.sqlite`,
	DB_TABLE = 'userdata',
	IMPOSSIBLE_ID = 0;

class MockConfigAdapter implements IConfigurationAdapter {
	
	constructor() {
	}

	get enableRemote(): boolean {
		return true;
	}

	public get(key: string): string {
		switch (key) {
			case S.DB_FILE: return CONN_FILE;
			default: return null;
		}
	}

	public fetch(): Promise<boolean> {
		return Promise.resolve(true);
	}

	public init(): Promise<void> {
		return Promise.resolve();
	}

	public dispose(): Promise<void> {
		return Promise.resolve();
	}
}

class UserEntity extends EntityBase {
	/* override */ static get tableName(): string {
		return DB_TABLE;
	}

	public name: string;
	public age: number;
}

class UserRepo extends RepositoryBase<UserEntity> {
	public query(): QueryBuilder<UserEntity> {
		return UserEntity.query();
	}
}

let dbAdapter: IDatabaseAdapter,
	cachedEnt: UserEntity;

// Commented. Because these tests make real connection to SqlLite file.
// Change `describe.skip(...)` to `describe(...)` to enable these tests.
describe.skip('RepositoryBase', () => {
	
	beforeEach('Initialize db adapter', async () => {
		dbAdapter = new KnexDatabaseAdapter(new MockConfigAdapter());
		dbAdapter.clientName = 'sqlite3';
		await dbAdapter.init();
	});

	afterEach('Tear down db adapter', async () => {
		await dbAdapter.dispose();
	});

	describe('create', () => {
		it('should insert a row to database', async () => {
			// Arrange
			let usrRepo = new UserRepo(),
				entity = new UserEntity();
			entity.name = 'Hiri';
			entity.age = 29;
			
			// Act
			let createdEnt: UserEntity = cachedEnt = await usrRepo.create(entity);
			
			// Assert
			expect(createdEnt).to.be.not.null;
			expect(createdEnt.id).to.be.greaterThan(0);
			expect(createdEnt.name).to.equal(entity.name);
			expect(createdEnt.age).to.equal(entity.age);
		});
	});

	describe('find', () => {
		it('should return an model instance if found', async () => {
			// Arrange
			let usrRepo = new UserRepo();
			
			// Act
			let foundEnt: UserEntity = await usrRepo.find(cachedEnt.id);
			
			// Assert
			expect(foundEnt).to.be.not.null;
			expect(foundEnt.id).to.equal(cachedEnt.id);
			expect(foundEnt.name).to.equal(cachedEnt.name);
			expect(foundEnt.age).to.equal(cachedEnt.age);
		});
		
		it('should return `undefined` if not found', async () => {
			// Arrange
			let usrRepo = new UserRepo();
			
			// Act
			let entity: UserEntity = await usrRepo.find(IMPOSSIBLE_ID);
			
			// Assert
			expect(entity).to.be.undefined;
		});
	});

	describe('patch', () => {
		it('should return a possitive number if found', async () => {
			// Arrange
			let usrRepo = new UserRepo(),
				newAge = 45;
			
			// Act
			let affectedRows: number = await usrRepo.patch({ id: cachedEnt.id, age: newAge}),
				refetchedEnt: UserEntity = await usrRepo.find(cachedEnt.id);
			
			// Assert
			expect(affectedRows).to.be.greaterThan(0);
			expect(refetchedEnt).to.be.not.null;
			expect(refetchedEnt.id).to.equal(cachedEnt.id);
			expect(refetchedEnt.name).to.equal(cachedEnt.name);
			expect(refetchedEnt.age).to.equal(newAge);
		});
		
		it('should return 0 if not found', async () => {
			// Arrange
			let usrRepo = new UserRepo(),
				newAge = 45;
			
			// Act
			let affectedRows: number = await usrRepo.patch({ id: IMPOSSIBLE_ID, age: newAge}),
				refetchedEnt: UserEntity = await usrRepo.find(IMPOSSIBLE_ID);
			
			// Assert
			expect(affectedRows).to.equal(0);
			// If `patch` returns 0, but we actually find an entity with the id, then something is wrong.
			expect(refetchedEnt).to.be.undefined;
		});
		
		it('should throw exception if `id` is not provided', async () => {
			// Arrange
			let usrRepo = new UserRepo(),
				newAge = 45;

			// Act
			let affectedRows = -1,
				exception = null;
			try {
				affectedRows = await usrRepo.patch({ age: newAge });
			} catch (ex) {
				exception = ex;
			}

			// Assert
			expect(affectedRows).to.equal(-1);
			expect(exception).to.be.an.instanceOf(InvalidArgumentException);
		});
	});

	describe('update', () => {
		it('should return a possitive number if found', async () => {
			// Arrange
			let usrRepo = new UserRepo(),
				newName = 'Brian',
				updatedEnt: UserEntity = Object.assign(new UserEntity, cachedEnt);
			updatedEnt.name = newName;
			
			// Act
			let affectedRows: number = await usrRepo.update(<UserEntity>updatedEnt),
				refetchedEnt: UserEntity = await usrRepo.find(cachedEnt.id);
			
			// Assert
			expect(affectedRows).to.be.greaterThan(0);
			expect(refetchedEnt).to.be.not.null;
			expect(refetchedEnt.id).to.equal(cachedEnt.id);
			expect(refetchedEnt.name).to.equal(newName);
			expect(refetchedEnt.age).to.equal(cachedEnt.age);
		});
		
		it('should return 0 if not found', async () => {
			// Arrange
			let usrRepo = new UserRepo(),
				newName = 'Brian',
				updatedEnt: UserEntity = Object.assign(new UserEntity, cachedEnt);
			updatedEnt.id = IMPOSSIBLE_ID;
			updatedEnt.name = newName;
			
			// Act
			let affectedRows: number = await usrRepo.update(<UserEntity>updatedEnt),
				refetchedEnt: UserEntity = await usrRepo.find(updatedEnt.id);
			
			// Assert
			expect(affectedRows).to.equal(0);
			// If `update` returns 0, but we actually find an entity with the id, then something is wrong.
			expect(refetchedEnt).to.be.undefined;
		});
		
		it('should throw exception if `id` is not provided', async () => {
			// Arrange
			let usrRepo = new UserRepo(),
				newName = 'Brian',
				updatedEnt: UserEntity = Object.assign(new UserEntity, cachedEnt);
			delete updatedEnt.id;
			updatedEnt.name = newName;

			// Act
			let affectedRows = -1,
				exception = null;
			try {
				affectedRows = await usrRepo.update(<UserEntity>updatedEnt);
			} catch (ex) {
				exception = ex;
			}

			// Assert
			expect(affectedRows).to.equal(-1);
			expect(exception).to.be.an.instanceOf(InvalidArgumentException);
		});
	});

	describe('delete', () => {
		it('should return a possitive number if found', async () => {
			// Arrange
			let usrRepo = new UserRepo();
			
			// Act
			let affectedRows: number = await usrRepo.delete(cachedEnt.id),
				refetchedEnt: UserEntity = await usrRepo.find(cachedEnt.id);
			
			// Assert
			expect(affectedRows).to.be.greaterThan(0);
			// If `delete` is successful, but we still find an entity with the id, then something is wrong.
			expect(refetchedEnt).to.be.undefined;
		});
		
		it('should return 0 if not found', async () => {
			// Arrange
			let usrRepo = new UserRepo();
			
			// Act
			let affectedRows: number = await usrRepo.delete(IMPOSSIBLE_ID),
				refetchedEnt: UserEntity = await usrRepo.find(IMPOSSIBLE_ID);
			
			// Assert
			expect(affectedRows).to.equal(0);
			// If `delete` returns 0, but we actually find an entity with the id, then something is wrong.
			expect(refetchedEnt).to.be.undefined;
		});		
	});
});