import * as _ from 'lodash';
import * as ex from '../microservice/Exceptions';

export class Guard {
	private constructor() {}

	public static assertDefined(name: string, target: any): void {
		if (target === null || target === undefined) {
			throw new ex.InvalidArgumentException(name, 'Must not be null or undefined!');
		}
	}

	public static assertNotEmpty(name: string, target: any): void {
		if (_.isEmpty(target)) {
			throw new ex.InvalidArgumentException(name, 'Must not be null, undefined or empty!');
		}
	}
	
	public static assertIsFunction(name: string, target: any): void {
		if (!_.isFunction(target)) {
			throw new ex.InvalidArgumentException(name, 'Must not be null, undefined or empty!');
		}
	}
	
	public static assertIsTruthy(target: any, message: string, isCritical: boolean = true): void {
		if (!target) {
			if (isCritical) {
				throw new ex.CriticalException(message);
			} else {
				throw new ex.MinorException(message);
			}
		}
	}
	
	public static assertIsMatch(name: string, rule: RegExp, target: string, message?: string): void {
		if (!rule.test(target)) {
			throw new ex.InvalidArgumentException(name, message || 'Does not match specified rule!');
		}
	}
	
}