/**
 * If an object wants to be initialized when microservice proccess starts, it must
 * implements this interface to be able to add to adapter list.
 */
declare interface IAdapter {
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

/**
 * Represents a data transfer object, aka: business model.
 */
declare interface IModelDTO {
	id: number;
}

declare type AutoMapper = AutoMapperJs.AutoMapper;