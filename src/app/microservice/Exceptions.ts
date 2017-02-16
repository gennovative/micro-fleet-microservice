export class Exception implements Error {

	private _name: string;
	private _stack: string;

	constructor(protected _message?: string, protected _isCritical?: boolean) {
		
	}

	public get name(): string {
		return this._stack;
	}

	public set name(value: string) {
		this._stack = value;
	}

	public get stack(): string {
		return this._stack;
	}

	public set stack(value: string) {
		this._stack = value;
	}

	public get message(): string {
		return this._message;
	}

	public get isCritical(): boolean {
		return this._isCritical;
	}

	public toString(): string {
		// Ex: [Critical] A big mess has happened!
		//	   [Minor] An error has occured!
		return `[${ (this._isCritical ? 'Critical' : 'Minor') }] ${ this._message ? this._message : 'An error has occured!' }`;
	}
}

export class CriticalException extends Exception {

	constructor(message?: string) {
		super(message, false);
	}
}

export class MinorException extends Exception {

	constructor(message?: string) {
		super(message, false);
	}
}

export class InvalidArgumentException extends Exception {

	constructor(argName: string, message?: string) {
		super(`The argument "${argName}" is invalid!${(message ? message : '')}`, true);
	}
}