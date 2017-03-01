export class Types {
	public static readonly MODEL_MAPPER = Symbol('AutoMapper');
	public static readonly BROKER_ADAPTER = Symbol('IMessageBrokerAdapter');
	public static readonly CONFIG_PROVIDER = Symbol('IConfigurationProvider');
	public static readonly DB_ADAPTER = Symbol('IDatabaseAdapter');
	public static readonly DEPENDENCY_CONTAINER = Symbol('IDependencyContainer');
	public static readonly DIRECT_RPC_CALLER = Symbol('IDirectRpcCaller');
	public static readonly DIRECT_RPC_HANDLER = Symbol('IDirectRpcHandler');
	public static readonly MEDIATE_RPC_CALLER = Symbol('IMediateRpcCaller');
	public static readonly MEDIATE_RPC_HANDLER = Symbol('IMediateRpcHandler');
};