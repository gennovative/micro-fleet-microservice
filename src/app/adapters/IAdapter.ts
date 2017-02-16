export interface IAdapter {
	/**
	 * Initializes this adapter.
	 * @returns A promise that resolves `true` if success, rejects if otherwise.
	 */
	init(): Promise<boolean>;
}