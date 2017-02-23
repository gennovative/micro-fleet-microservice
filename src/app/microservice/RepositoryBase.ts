import { QueryBuilder } from 'objection';
import { EntityBase } from './EntityBase';
import { Guard } from '../utils/Guard';

export interface IRepository<TEntity extends EntityBase> {
	create(ent: TEntity): Promise<TEntity>;
	delete(id: number): Promise<number>;
	find(id: number): Promise<TEntity>;
	patch(entity: Partial<TEntity>): Promise<number>;
	update(entity: TEntity): Promise<number>;
	query(): QueryBuilder<TEntity>;
}

export abstract class RepositoryBase<TEntity extends EntityBase>
			implements IRepository<TEntity> {

	public async create(ent: TEntity): Promise<TEntity> {
		let newEnt = await this.query().insert(ent);
		return newEnt;
	}

	public async delete(id: number): Promise<number> {
		let affectedRows = await this.query().deleteById(id);
		return affectedRows;
	}

	public async find(id: number): Promise<TEntity> {
		let foundEnt = await this.query().findById(id);
		return foundEnt;
	}

	public async patch(entity: Partial<TEntity>): Promise<number> {
		Guard.assertDefined('entity.id', entity.id);
		let affectedRows = await this.query().where('id', entity.id).patch(<TEntity>entity);
		return affectedRows;
	}

	public async update(entity: TEntity): Promise<number> {
		Guard.assertDefined('entity.id', entity.id);
		let affectedRows = await this.query().where('id', entity.id).update(entity);
		return affectedRows;
	}

	public abstract query(): QueryBuilder<TEntity>;
}