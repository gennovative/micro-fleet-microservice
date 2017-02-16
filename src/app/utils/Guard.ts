import { InvalidArgumentException } from '../microservice/Exceptions';

export class Guard {
	private constructor() {}

	public static assertDefined(name: string, target: any): void {
		if (target === null || target === undefined) {
			throw new InvalidArgumentException(name, 'Must not be null or undefined!');
		}
	}
}