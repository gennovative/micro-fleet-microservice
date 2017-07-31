export class Types {
	public static readonly MODEL_MAPPER = Symbol('AutoMapper');
	public static readonly BROKER_ADDON = Symbol('IMessageBrokerAddOn');
	public static readonly CONFIG_PROVIDER = Symbol('IConfigurationProvider');
	public static readonly DB_ADDON = Symbol('IDatabaseAddOn');
	public static readonly DEPENDENCY_CONTAINER = Symbol('IDependencyContainer');
}