import * as path from 'path'
import { EventEmitter } from 'events'
import * as cm from '@micro-fleet/common'

import { Module } from '../constants/Module'
import { Action } from '../constants/Action'


const { SvcSettingKeys: S } = cm.constants

type IDirectRpcCaller = import('@micro-fleet/service-communication').IDirectRpcCaller
type RpcResponse = import('@micro-fleet/service-communication').RpcResponse


/**
 * Provides settings from appconfig.json, environmental variables and remote settings service.
 */
@cm.injectable()
export class ConfigurationProvider
        implements cm.IConfigurationProvider {
    public readonly name: string = 'ConfigurationProvider'

    /**
     * @see IConfigurationProvider.enableRemote
     */
    public enableRemote: boolean

    /**
     * @see IConfigurationProvider.configFilePath
     */
    public configFilePath: string

    private _addresses: string[]
    private _eventEmitter: EventEmitter
    private _fileSettings: object
    private _remoteSettings: object
    private _refetchTimer: NodeJS.Timer
    private _refetchInterval: number
    private _isInit: boolean

    // @cm.lazyInject(require('@micro-fleet/service-communication').DIRECT_RPC_CALLER)
    @cm.lazyInject('service-communication.IDirectRpcCaller')
    private _rpcCaller: IDirectRpcCaller

    constructor() {
        this.configFilePath = path.resolve(process.cwd(), './dist/app/configs/appconfig')
        this._remoteSettings = this._fileSettings = {}
        this.enableRemote = false
        this._eventEmitter = new EventEmitter()
        this._isInit = false
    }

    //#region Getters & Setters

    private get refetchInterval(): number {
        return this._refetchInterval
    }

    private set refetchInterval(val: number) {
        this._refetchInterval = val
        if (this._refetchTimer) {
            this._stopRefetch()
            this._repeatFetch()
        }
    }

    //#endregion Getters & Setters


    /**
     * @see IServiceAddOn.init
     */
    public init(): Promise<void> {
        if (this._isInit) {
            return Promise.resolve()
        }
        this._isInit = true

        try {
            this._fileSettings = require(this.configFilePath)
        } catch (ex) {
            // TODO: Should use logger
            // console.warn(ex);
            this._fileSettings = {}
        }

        if (this.enableRemote) {
            this._rpcCaller.name = this.name
            this._applySettings().orElse(() => {
                throw new cm.CriticalException('No address for Settings Service!')
            })
        }

        return Promise.resolve()
    }

    /**
     * @see IServiceAddOn.deadLetter
     */
    public deadLetter(): Promise<void> {
        return Promise.resolve()
    }

    /**
     * @see IServiceAddOn.dispose
     */
    public dispose(): Promise<void> {
        this._stopRefetch()
        this.configFilePath = null
        this._fileSettings = null
        this._remoteSettings = null
        this.enableRemote = null
        this._rpcCaller = null
        this._eventEmitter = null
        this._isInit = null
        return Promise.resolve()
    }

    /**
     * @see IConfigurationProvider.get
     */
    public get(key: string, dataType?: cm.SettingItemDataType): cm.Maybe<number | boolean | string> {
        let value = this._remoteSettings[key]
        if (value == null) {
            value = Boolean(dataType)
                ? this._parseValue(this._getEnvOrFile(key), dataType)
                : this._getEnvOrFile(key)
        }
        return (value != null ? cm.Maybe.Just(value) : cm.Maybe.Nothing())
    }

    private _getEnvOrFile(key: string): any {
        if (process.env[key] != null) {
            return process.env[key]
        }
        return this._fileSettings[key]
    }

    /**
     * @see IConfigurationProvider.fetch
     */
    public async fetch(): Promise<boolean> { // TODO: Should be privately called.
        if (!this.enableRemote) { return false }

        const allAddr = this._addresses,
            addrToTry: string[] = [...allAddr],
            oldSettings = this._remoteSettings

        // Manual loop with "JS label"
        tryFetch: {
            const addr = addrToTry.shift()
            if (addr) {
                this._remoteSettings = await this._attemptFetch(addr)
                if (this._remoteSettings) {
                    // Move this address onto top of list
                    const pos = allAddr.indexOf(addr)
                    if (pos != 0) {
                        allAddr.splice(pos, 1)
                        allAddr.unshift(addr)
                    }

                    this._broadCastChanges(oldSettings, this._remoteSettings)
                    if (this._refetchTimer === undefined) {
                        this._updateSelf()
                        this._repeatFetch()
                    }
                    // Stop trying if success
                    return true
                }
                break tryFetch
            }
        }

        // Don't throw error on refetching
        if (this._refetchTimer === undefined) {
            throw new cm.CriticalException('Cannot connect to any address of Configuration Service!')
        }
        return false
    }

    public onUpdate(listener: (changedKeys: string[]) => void): void {
        this._eventEmitter.on('updated', listener)
    }


    private _applySettings(): cm.Maybe<string[]> {
        this.refetchInterval = this.get(S.CONFIG_REFETCH_INTERVAL).tryGetValue(5 * 60000) as number // Default 5 mins
        try {
            const addresses: string[] = JSON.parse(this.get(S.CONFIG_SERVICE_ADDRESSES).value as any)
            if (addresses && addresses.length) {
                this._addresses = addresses
                return cm.Maybe.Just(addresses)
            }
        } catch (err) {
            console.warn(err)
        }
        return cm.Maybe.Nothing()
    }

    private _updateSelf(): void {
        this._eventEmitter.prependListener('updated', (changedKeys: string[]) => {
            if (changedKeys.includes(S.CONFIG_REFETCH_INTERVAL) || changedKeys.includes(S.CONFIG_SERVICE_ADDRESSES)) {
                this._applySettings().orElse(() => {
                    console.warn('New SettingService addresses are useless!')
                })
            }
        })
    }

    private _repeatFetch(): void {
        this._refetchTimer = setInterval(() => this.fetch(), this.refetchInterval)
    }

    private _stopRefetch(): void {
        clearInterval(this._refetchTimer)
        this._refetchTimer = null
    }


    private async _attemptFetch(address: string): Promise<object> {
        try {
            const serviceName = this.get(S.SERVICE_SLUG),
                ipAddress = '0.0.0.0' // If this service runs inside a Docker container,
                                // this should be the host's IP address.

            this._rpcCaller.baseAddress = address
            const req = cm.GetSettingRequest.translator.whole({
                slug: serviceName.value,
                ipAddress,
            })

            const res: RpcResponse = await this._rpcCaller.call(Module.CONFIG_CONTROL, Action.GET_SETTINGS, req)
            if (res.isSuccess) {
                return this._parseSettings(res.payload)
            }
        } catch (err) {
            console.warn(err)
        }
        return null
    }

    private _broadCastChanges(oldSettings: any, newSettings: any): void {
        if (!newSettings) { return }
        const oldKeys = Object.getOwnPropertyNames(oldSettings)
        const newKeys = Object.getOwnPropertyNames(newSettings)
        const changedKeys: string[] = []

        // Update existing values or add new keys
        for (const key of newKeys) {
            if (newSettings[key] !== oldSettings[key]) {
                changedKeys.push(key)
            }
        }

        // Reset abandoned keys.
        for (const key of oldKeys) {
            if (!newKeys.includes(key)) {
                changedKeys.push(key)
            }
        }

        if (changedKeys.length) {
            this._eventEmitter.emit('updated', changedKeys)
        }
    }

    private _parseSettings(raw: any) {
        if (!raw) { return {} }

        const map = {},
            settings: cm.SettingItem[] = cm.SettingItem.translator.wholeMany(raw)
        for (const st of settings) {
            map[st.name] = this._parseValue(st.value, st.dataType)
        }
        return map
    }

    private _parseValue(val: any, type: any) {
        if (val === undefined) { return null }

        if (type == cm.SettingItemDataType.String) {
            return val
        } else {
            return JSON.parse(val)
        }
    }
}
