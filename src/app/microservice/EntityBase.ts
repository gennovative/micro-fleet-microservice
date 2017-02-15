import { Model } from 'objection';

export abstract class EntityBase extends Model {

	static get tableName(): string {
		throw 'This method must be implemented by derived class!';
	}

	public id: number;
}