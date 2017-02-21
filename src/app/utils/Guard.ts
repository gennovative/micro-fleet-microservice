import * as _ from 'lodash';
import { InvalidArgumentException } from '../microservice/Exceptions';

export class Guard {
	private constructor() {}

	public static assertDefined(name: string, target: any): void {
		if (target === null || target === undefined) {
			throw new InvalidArgumentException(name, 'Must not be null or undefined!');
		}
	}

	public static assertNotEmpty(name: string, target: any): void {
		if (_.isEmpty(target)) {
			throw new InvalidArgumentException(name, 'Must not be null, undefined or empty!');
		}
	}
	
	public static assertIsFunction(name: string, target: any): void {
		if (!_.isFunction(target)) {
			throw new InvalidArgumentException(name, 'Must not be null, undefined or empty!');
		}
	}
}