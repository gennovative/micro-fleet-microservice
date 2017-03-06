export class Exception implements Error {

	private _name: string;
	private _stack: string;

	constructor(protected _message?: string, protected _isCritical?: boolean) {
		this._stack = '';
		this._name = '';
		Error.captureStackTrace(this, Exception);
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
		// Ex 1: [Critical] A big mess has happened!
		//		 <stacktrace here>
		//
		// Ex 2: [Minor]
		//		 <stacktrace here>
		return `[${ (this._isCritical ? 'Critical' : 'Minor') }] ${ this._message ? this._message : '' } \n ${this._stack}`;
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
		super(`The argument "${argName}" is invalid! ${(message ? message : '')}`, true);
	}
}