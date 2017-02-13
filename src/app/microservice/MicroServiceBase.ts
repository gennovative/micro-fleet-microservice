export abstract class MicroServiceBase {
	public onStarting(thisService: MicroServiceBase): void {
	}

	public onStarted(thisService: MicroServiceBase): void {
	}

	public onStopping(thisService: MicroServiceBase): void {
	}

	public onStopped(thisService: MicroServiceBase): void {
	}

	public start(): void {
		this.onStarting(this);
		this.onStarted(this);
	}

	public stop(): void {
		this.onStopping(this);
		this.onStopped(this);
	}
}