export interface IAdapter {
	/**
	 * Initializes this adapter.
	 * @returns A promise that resolves `true` if success, rejects if otherwise.
	 */
	init(): Promise<void>;
	
	/**
	 * Stops this adapter and cleans all resources.
	 */
	dispose(): Promise<void>;
}