import 'automapper-ts'; // Singleton
import { expect } from 'chai';
import { Model, QueryBuilder } from 'objection';

import { RepositoryBase, EntityBase, InvalidArgumentException, inject,
	IConfigurationProvider, IDatabaseAdapter, KnexDatabaseAdapter,
	SettingKeys as S, Types as T } from '../../app';

const CONN_FILE = `${process.cwd()}/database-adapter-test.sqlite`,
	DB_TABLE = 'userdata',
	IMPOSSIBLE_ID = 0;

class MockConfigAdapter implements IConfigurationProvider {
	
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

// Should put this in Types.ts
const TYPE_USER_DTO = Symbol('UserDTO'),
	TYPE_USER_ENT = Symbol('UserEntity');

class UserDTO implements IModelDTO {
	// NOTE: Class variales must be initialized, otherwise they
	// will disappear in transpiled code.
	public id: number = undefined;
	public name: string = undefined;
	public age: number = undefined;
}

class UserEntity extends EntityBase {
	/* override */ static get tableName(): string {
		return DB_TABLE;
	}

	// NOTE: Class variales must be initialized, otherwise they
	// will disappear in transpiled code.
	public name: string = undefined;
	public age: number = undefined;
}

class UserRepo extends RepositoryBase<UserEntity, UserDTO> {
	
	constructor(
		@inject(T.MODEL_MAPPER) modelMapper: AutoMapper
	) {
		super(modelMapper);
	}

	protected /* override */ query(): QueryBuilder<UserEntity> {
		return UserEntity.query();
	}

	protected /* override */ createModelMap(): void {
		let mapper = this._modelMapper;
		mapper.createMap(UserDTO, UserEntity);		
		mapper.createMap(UserEntity, UserDTO);
			// Ignores all properties that UserEntity has but UserDTO doesn't.
			//.convertToType(UserDTO);
	}

	protected /* override */ toEntity(from: UserDTO): UserEntity {
		return this._modelMapper.map(UserDTO, UserEntity, from);
							// (DTO)===^         ^===(Entity)
	}

	protected /* override */ toDTO(from: UserDTO): UserDTO {
		return this._modelMapper.map(UserEntity, UserDTO, from);
							// (Entity)===^         ^===(DTO)
								// Be EXTREMELY careful! It's very easy to make mistake here!
	}
}

let dbAdapter: IDatabaseAdapter,
	cachedDTO: UserDTO;

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
			let usrRepo = new UserRepo(automapper),
				entity = new UserDTO();
			entity.name = 'Hiri';
			entity.age = 29;
			
			// Act
			let createdEnt: UserDTO = cachedDTO = await usrRepo.create(entity);
			
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
			let usrRepo = new UserRepo(automapper);
			
			// Act
			let foundModel: UserDTO = await usrRepo.find(cachedDTO.id);
			
			// Assert
			expect(foundModel).to.be.not.null;
			expect(foundModel.id).to.equal(cachedDTO.id);
			expect(foundModel.name).to.equal(cachedDTO.name);
			expect(foundModel.age).to.equal(cachedDTO.age);
		});
		
		it('should return `undefined` if not found', async () => {
			// Arrange
			let usrRepo = new UserRepo(automapper);
			
			// Act
			let model: UserDTO = await usrRepo.find(IMPOSSIBLE_ID);
			
			// Assert
			expect(model).to.be.undefined;
		});
	});

	describe('patch', () => {
		it('should return a possitive number if found', async () => {
			// Arrange
			let usrRepo = new UserRepo(automapper),
				newAge = 45;
			
			// Act
			let affectedRows: number = await usrRepo.patch({ id: cachedDTO.id, age: newAge}),
				refetchedModel: UserDTO = await usrRepo.find(cachedDTO.id);
			
			// Assert
			expect(affectedRows).to.be.greaterThan(0);
			expect(refetchedModel).to.be.not.null;
			expect(refetchedModel.id).to.equal(cachedDTO.id);
			expect(refetchedModel.name).to.equal(cachedDTO.name);
			expect(refetchedModel.age).to.equal(newAge);
		});
		
		it('should return 0 if not found', async () => {
			// Arrange
			let usrRepo = new UserRepo(automapper),
				newAge = 45;
			
			// Act
			let affectedRows: number = await usrRepo.patch({ id: IMPOSSIBLE_ID, age: newAge}),
				refetchedModel: UserDTO = await usrRepo.find(IMPOSSIBLE_ID);
			
			// Assert
			expect(affectedRows).to.equal(0);
			// If `patch` returns 0, but we actually find an entity with the id, then something is wrong.
			expect(refetchedModel).to.be.undefined;
		});
		
		it('should throw exception if `id` is not provided', async () => {
			// Arrange
			let usrRepo = new UserRepo(automapper),
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
			let usrRepo = new UserRepo(automapper),
				newName = 'Brian',
				updatedEnt: UserDTO = Object.assign(new UserDTO, cachedDTO);
			updatedEnt.name = newName;
			
			// Act
			let affectedRows: number = await usrRepo.update(<UserDTO>updatedEnt),
				refetchedModel: UserDTO = await usrRepo.find(cachedDTO.id);
			
			// Assert
			expect(affectedRows).to.be.greaterThan(0);
			expect(refetchedModel).to.be.not.null;
			expect(refetchedModel.id).to.equal(cachedDTO.id);
			expect(refetchedModel.name).to.equal(newName);
			expect(refetchedModel.age).to.equal(cachedDTO.age);
		});
		
		it('should return 0 if not found', async () => {
			// Arrange
			let usrRepo = new UserRepo(automapper),
				newName = 'Brian',
				updatedEnt: UserDTO = Object.assign(new UserDTO, cachedDTO);
			updatedEnt.id = IMPOSSIBLE_ID;
			updatedEnt.name = newName;
			
			// Act
			let affectedRows: number = await usrRepo.update(<UserDTO>updatedEnt),
				refetchedEnt: UserDTO = await usrRepo.find(updatedEnt.id);
			
			// Assert
			expect(affectedRows).to.equal(0);
			// If `update` returns 0, but we actually find an entity with the id, then something is wrong.
			expect(refetchedEnt).to.be.undefined;
		});
		
		it('should throw exception if `id` is not provided', async () => {
			// Arrange
			let usrRepo = new UserRepo(automapper),
				newName = 'Brian',
				updatedEnt: UserDTO = Object.assign(new UserDTO, cachedDTO);
			delete updatedEnt.id;
			updatedEnt.name = newName;

			// Act
			let affectedRows = -1,
				exception = null;
			try {
				affectedRows = await usrRepo.update(<UserDTO>updatedEnt);
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
			let usrRepo = new UserRepo(automapper);
			
			// Act
			let affectedRows: number = await usrRepo.delete(cachedDTO.id),
				refetchedEnt: UserDTO = await usrRepo.find(cachedDTO.id);
			
			// Assert
			expect(affectedRows).to.be.greaterThan(0);
			// If `delete` is successful, but we still find an entity with the id, then something is wrong.
			expect(refetchedEnt).to.be.undefined;
		});
		
		it('should return 0 if not found', async () => {
			// Arrange
			let usrRepo = new UserRepo(automapper);
			
			// Act
			let affectedRows: number = await usrRepo.delete(IMPOSSIBLE_ID),
				refetchedEnt: UserDTO = await usrRepo.find(IMPOSSIBLE_ID);
			
			// Assert
			expect(affectedRows).to.equal(0);
			// If `delete` returns 0, but we actually find an entity with the id, then something is wrong.
			expect(refetchedEnt).to.be.undefined;
		});		
	});
});