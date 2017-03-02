import { QueryBuilder } from 'objection';
import { injectable } from '../utils/DependencyContainer';
import { EntityBase } from '../persistence/EntityBase';
import { Guard } from '../utils/Guard';


export interface IRepository<TModel extends IModelDTO> {
	countAll(): Promise<number>;
	create(model: TModel): Promise<TModel>;
	delete(id: number): Promise<number>;
	find(id: number): Promise<TModel>;
	page(pageIndex: number, pageSize: number): Promise<TModel[]>;
	patch(model: Partial<TModel>): Promise<number>;
	update(model: TModel): Promise<number>;
}

@injectable()
export abstract class RepositoryBase<TEntity extends EntityBase, TModel extends IModelDTO>
			implements IRepository<TModel> {

	constructor(protected _modelMapper: AutoMapper) {
		Guard.assertDefined('modelMapper', this._modelMapper);
		this.createModelMap();
	}

	public async countAll(): Promise<number> {
		let count = await <any>this.query().count('id');
		
		 // In case with Postgres, `count` returns a bigint type which will be a String 
		 // and not a Number.
		return (count * 1);
	}

	public async create(model: TModel): Promise<TModel> {
		let newEnt = await this.query().insert(model);
		return this.toDTO(newEnt);
	}

	public async delete(id: number): Promise<number> {
		let affectedRows = await this.query().deleteById(id);
		return affectedRows;
	}

	public async find(id: number): Promise<TModel> {
		let foundEnt = await this.query().findById(id);
		return this.toDTO(foundEnt);
	}

	public async patch(model: Partial<TModel>): Promise<number> {
		Guard.assertDefined('entity.id', model.id);
		let affectedRows = await this.query().where('id', model.id).patch(<TModel>model);
		return affectedRows;
	}

	public async page(pageIndex: number, pageSize: number): Promise<TModel[]> {
		let foundList = await this.query().page(pageIndex, pageSize);
		return this.toDTO(foundList);
	}

	public async update(model: TModel): Promise<number> {
		Guard.assertDefined('entity.id', model.id);
		let affectedRows = await this.query().where('id', model.id).update(model);
		return affectedRows;
	}

	protected abstract query(): QueryBuilder<TEntity>;
	protected abstract createModelMap(): void;
	protected abstract toEntity(from: TModel | TModel[]): TEntity & TEntity[];
	protected abstract toDTO(from: TEntity | TEntity[]): TModel & TModel[];
}