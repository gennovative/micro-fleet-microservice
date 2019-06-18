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

    private _addresses: string[]
    private _configFilePath: string
    private _enableRemote: boolean
    private _eventEmitter: EventEmitter
    private _fileSettings: any
    private _remoteSettings: any
    private _refetchTimer: NodeJS.Timer
    private _refetchInterval: number
    private _isInit: boolean

    // @cm.lazyInject(require('@micro-fleet/service-communication').DIRECT_RPC_CALLER)
    @cm.lazyInject('service-communication.IDirectRpcCaller')
    private _rpcCaller: IDirectRpcCaller

    constructor() {
        this._configFilePath = path.resolve(process.cwd(), './dist/app/configs/appconfig')
        this._remoteSettings = this._fileSettings = {}
        this._enableRemote = false
        this._eventEmitter = new EventEmitter()
        this._isInit = false
    }

    //#region Getters & Setters

    /**
     * @see IConfigurationProvider.enableRemote
     */
    public get enableRemote(): boolean {
        return this._enableRemote
    }

    public set enableRemote(val: boolean) {
        this._enableRemote = val
    }


    private get refetchInterval(): number {
        return this._refetchInterval
    }

    private set refetchInterval(val: number) {
        this._refetchInterval = val
        if (this._refetchTimer) {
            this.stopRefetch()
            this.repeatFetch()
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
            this._fileSettings = require(this._configFilePath)
        } catch (ex) {
            // TODO: Should use logger
            // console.warn(ex);
            this._fileSettings = {}
        }

        if (this.enableRemote) {
            this._rpcCaller.name = this.name
            const addresses = this.applySettings()
            if (!addresses.isJust) {
                return Promise.reject(new cm.CriticalException('No address for Settings Service!'))
            }
            this._addresses = addresses.value
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
        this.stopRefetch()
        this._configFilePath = null
        this._fileSettings = null
        this._remoteSettings = null
        this._enableRemote = null
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
        if (value === undefined && dataType) {
            value = this.parseValue(process.env[key] || this._fileSettings[key], dataType)
        } else if (value === undefined) {
            value = process.env[key] || this._fileSettings[key]
        }
        return (value ? cm.Maybe.Just(value) : cm.Maybe.Nothing())
    }

    /**
     * @see IConfigurationProvider.fetch
     */
    public async fetch(): Promise<boolean> { // TODO: Should be privately called.
        const addresses: string[] = Array.from(this._addresses),
            oldSettings = this._remoteSettings

        // Manual loop with "JS label"
        tryFetch: {
            const addr = addresses.shift()
            if (addr) {
                if (await this.attemptFetch(addr)) {
                    // Move this address onto top of list
                    const pos = addresses.indexOf(addr)
                    if (pos != 0) {
                        addresses.splice(pos, 1)
                        addresses.unshift(addr)
                    }

                    this.broadCastChanges(oldSettings, this._remoteSettings)
                    if (this._refetchTimer === undefined) {
                        this.updateSelf()
                        this.repeatFetch()
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

    private applySettings(): cm.Maybe<string[]> {
        this.refetchInterval = this.get(S.SETTINGS_REFETCH_INTERVAL).tryGetValue(5 * 60000) as number // Default 5 mins
        try {
            const addresses: string[] = JSON.parse(this.get(S.SETTINGS_SERVICE_ADDRESSES).value as any)
            return (addresses && addresses.length) ? cm.Maybe.Just(addresses) : cm.Maybe.Nothing()
        } catch (err) {
            return cm.Maybe.Nothing()
        }
    }

    private updateSelf(): void {
        this._eventEmitter.prependListener('updated', (changedKeys: string[]) => {
            if (changedKeys.includes(S.SETTINGS_REFETCH_INTERVAL) || changedKeys.includes(S.SETTINGS_SERVICE_ADDRESSES)) {
                const addresses = this.applySettings()
                if (addresses.isJust) {
                    this._addresses = addresses.value
                } else {
                    console.warn('New SettingService addresses are useless!')
                }
            }
        })
    }

    private repeatFetch(): void {
        this._refetchTimer = setInterval(() => this.fetch(), this.refetchInterval)
    }

    private stopRefetch(): void {
        clearInterval(this._refetchTimer)
        this._refetchTimer = null
    }


    private async attemptFetch(address: string): Promise<boolean> {
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
                this._remoteSettings = this.parseSettings(res.payload)
                return true
            }
        } catch (err) {
            console.warn(err)
        }
        return false
    }

    private broadCastChanges(oldSettings: any, newSettings: any): void {
        if (!newSettings) { return }
        const oldKeys = Object.getOwnPropertyNames(oldSettings)
        const newKeys = Object.getOwnPropertyNames(newSettings)
        const changedKeys: string[] = []
        let val

        // Update existing values or add new keys
        for (const key of newKeys) {
            val = newSettings[key]
            if (val !== oldSettings[key]) {
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

    private parseSettings(raw: any) {
        if (!raw) { return {} }

        const map = {},
            settings: cm.SettingItem[] = cm.SettingItem.translator.wholeMany(raw)
        for (const st of settings) {
            map[st.name] = this.parseValue(st.value, st.dataType)
        }
        return map
    }

    private parseValue(val: any, type: any) {
        if (val === undefined) { return null }

        if (type == cm.SettingItemDataType.String) {
            return val
        } else {
            return JSON.parse(val)
        }
    }
}
