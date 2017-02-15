import { QueryBuilderSingle } from 'objection';
import { EntityBase } from './EntityBase';

export abstract class RepositoryBase<TEntity extends EntityBase> {

	public async create(ent: TEntity): Promise<TEntity> {
		let newEnt = await this.query().insert(ent);
		return newEnt;
	}

	public async delete(ent: TEntity): Promise<number> {
		let affectedRows = await this.query().deleteById(ent.id);
		return affectedRows;
	}

	public async find(id: number): Promise<TEntity> {
		let foundEnt = await this.query().findById(id);
		return foundEnt;
	}

	public async update(ent: TEntity): Promise<number> {
		let affectedRows = await this.query().where('id', ent.id).update(ent);
		return affectedRows;
	}

	public abstract query(): QueryBuilderSingle<TEntity>;
}