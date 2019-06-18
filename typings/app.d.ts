/// <reference path="./global.d.ts" />
declare module '@micro-fleet/microservice/dist/app/constants/Module' {
	export enum Module {
	    CONFIG_CONTROL = "configControl"
	}

}
declare module '@micro-fleet/microservice/dist/app/constants/Action' {
	export enum Action {
	    GET_SETTINGS = "getSettings"
	}

}
declare module '@micro-fleet/microservice/dist/app/addons/ConfigurationProvider' {
	import * as cm from '@micro-fleet/common';
	/**
	 * Provides settings from appconfig.json, environmental variables and remote settings service.
	 */
	export class ConfigurationProvider implements cm.IConfigurationProvider {
	    readonly name: string;
	    	    	    	    	    	    	    	    	    	    	    constructor();
	    /**
	     * @see IConfigurationProvider.enableRemote
	     */
	    enableRemote: boolean;
	    	    /**
	     * @see IServiceAddOn.init
	     */
	    init(): Promise<void>;
	    /**
	     * @see IServiceAddOn.deadLetter
	     */
	    deadLetter(): Promise<void>;
	    /**
	     * @see IServiceAddOn.dispose
	     */
	    dispose(): Promise<void>;
	    /**
	     * @see IConfigurationProvider.get
	     */
	    get(key: string, dataType?: cm.SettingItemDataType): cm.Maybe<number | boolean | string>;
	    /**
	     * @see IConfigurationProvider.fetch
	     */
	    fetch(): Promise<boolean>;
	    onUpdate(listener: (changedKeys: string[]) => void): void;
	    	    	    	    	    	    	    	    	}

}
declare module '@micro-fleet/microservice/dist/app/constants/Types' {
	export class Types {
	}

}
declare module '@micro-fleet/microservice/dist/app/microservice/MicroServiceBase' {
	import * as cm from '@micro-fleet/common';
	export abstract class MicroServiceBase {
	    protected _configProvider: cm.IConfigurationProvider;
	    protected _depContainer: cm.IDependencyContainer;
	    protected _addons: IServiceAddOn[];
	    protected _isStarted: boolean;
	    constructor();
	    readonly isStarted: boolean;
	    /**
	     * Bootstraps this service application.
	     */
	    start(): void;
	    /**
	     * Gracefully stops this application and exit
	     */
	    stop(exitProcess?: boolean): void;
	    /**
	     * @return Total number of add-ons that have been added so far.
	     */
	    protected attachAddOn(addon: IServiceAddOn): number;
	    protected attachConfigProvider(): cm.IConfigurationProvider;
	    protected registerConfigProvider(): void;
	    protected registerDependencies(): void;
	    /**
	     * Invoked whenever any error occurs in the application.
	     */
	    protected onError(error: any): void;
	    /**
	     * Invoked after registering dependencies, but before all other initializations.
	     */
	    protected onStarting(): void;
	    /**
	     * Invoked after all initializations. At this stage, the application is considered
	     * started successfully.
	     */
	    protected onStarted(): void;
	    /**
	     * Invoked when `stop` method is called, before any other actions take place.
	     */
	    protected onStopping(): void;
	    /**
	     * Invoked after all finalizations have finished. At this stage, the application is
	     * considered stopped successfully. The process will be killed after this.
	     */
	    protected onStopped(): void;
	    	    	    	    /**
	     * Gracefully shutdown the application when user presses Ctrl-C in Console/Terminal,
	     * or when the OS is trying to stop the service process.
	     *
	     */
	    	    	}

}
declare module '@micro-fleet/microservice' {
	export * from '@micro-fleet/microservice/dist/app/addons/ConfigurationProvider';
	export * from '@micro-fleet/microservice/dist/app/constants/Types';
	export * from '@micro-fleet/microservice/dist/app/microservice/MicroServiceBase';

}
declare module '@micro-fleet/microservice/dist/app/configs/appconfig' {
	 const D: typeof import("@micro-fleet/common/dist/app/constants/setting-keys/database").DbSettingKeys; const M: typeof import("@micro-fleet/common/dist/app/constants/setting-keys/message-broker").MbSettingKeys; const S: typeof import("@micro-fleet/common/dist/app/constants/setting-keys/service").SvcSettingKeys; const _default: {
	    D: typeof import("@micro-fleet/common/dist/app/constants/setting-keys/database").DbSettingKeys;
	    M: typeof import("@micro-fleet/common/dist/app/constants/setting-keys/message-broker").MbSettingKeys;
	    S: typeof import("@micro-fleet/common/dist/app/constants/setting-keys/service").SvcSettingKeys;
	    [S.ADDONS_DEADLETTER_TIMEOUT]: number;
	    [S.SERVICE_SLUG]: string;
	    [S.SETTINGS_REFETCH_INTERVAL]: string[];
	    [D.DB_ENGINE]: import("@micro-fleet/common/dist/app/constants/DbClient").DbClient;
	    [D.DB_ADDRESS]: string;
	    [D.DB_USER]: string;
	    [D.DB_PASSWORD]: string;
	    [D.DB_NAME]: string;
	    [M.MSG_BROKER_HOST]: string;
	    [M.MSG_BROKER_RECONN_TIMEOUT]: number;
	    [M.MSG_BROKER_USERNAME]: string;
	    [M.MSG_BROKER_PASSWORD]: string;
	    [M.MSG_BROKER_EXCHANGE]: string;
	    [M.MSG_BROKER_QUEUE]: string;
	    [M.MSG_BROKER_MSG_EXPIRE]: number;
	};
	export = _default;

}
