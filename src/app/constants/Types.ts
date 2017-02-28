export class Types {
	public static MODEL_MAPPER = Symbol('AutoMapper');
	public static BROKER_ADAPTER = Symbol('IMessageBrokerAdapter');
	public static CONFIG_ADAPTER = Symbol('IConfigurationAdapter');
	public static DB_ADAPTER = Symbol('IDatabaseAdapter');
	public static DEPENDENCY_CONTAINER = Symbol('IDependencyContainer');
};