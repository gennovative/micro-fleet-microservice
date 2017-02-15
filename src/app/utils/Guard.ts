export class Guard {
	private constructor() {}

	public static assertDefined(target: any): void {
		if (target === null || target === undefined) {
			throw 'Argument must not be null or undefined.';
		}
	}
}