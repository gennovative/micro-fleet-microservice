export class Types {
	public static MODEL_MAPPER = Symbol('AutoMapper');
	public static BROKER_ADAPTER = Symbol('IMessageBrokerAdapter');
	public static CONFIG_ADAPTER = Symbol('IConfigurationProvider');
	public static DB_ADAPTER = Symbol('IDatabaseAdapter');
	public static DEPENDENCY_CONTAINER = Symbol('IDependencyContainer');
	public static DIRECT_RPC_CALLER = Symbol('IDirectRpcCaller');
	public static DIRECT_RPC_HANDLER = Symbol('IDirectRpcHandler');
	public static MB_RPC_CALLER = Symbol('IRpcCaller');
	public static MB_RPC_HANDLER = Symbol('IRpcHandler');
};