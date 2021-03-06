import * as path from 'path'
import * as chai from 'chai'
import * as spies from 'chai-spies'
import { CriticalException, SettingItem, SettingItemDataType,
    constants, Maybe } from '@micro-fleet/common'
const { RPC: R, Service: S, MessageBroker: M } = constants

import { IDirectRpcCaller, RpcResponse, RpcCallerOptions } from '@micro-fleet/service-communication'

import * as app from '../../app'
import { ConfigurationProviderAddOn } from '../../app/ConfigurationProviderAddOn'


chai.use(spies)
const expect = chai.expect

// Mock fetched config

const CONFIG_SVC_ADDRESSES = ['127.0.0.1', '127.0.0.2', '127.0.0.3'],
    BROKER_PASSWORD = 'secret',
    SUCCESS_CONFIG: SettingItem[] = [
        {
            name: S.CONFIG_SERVICE_ADDRESSES,
            dataType: SettingItemDataType.String,
            value: JSON.stringify(CONFIG_SVC_ADDRESSES),
        },
        {
            name: M.MSG_BROKER_HOST,
            dataType: SettingItemDataType.String,
            value: '127.0.0.1/rabbitmq',
        },
        {
            name: R.RPC_CALLER_TIMEOUT,
            dataType: SettingItemDataType.Number,
            value: '1000',
        },
        {
            name: S.CONFIG_REFETCH_INTERVAL,
            dataType: SettingItemDataType.Number,
            value: '1000',
        },
        {
            name: 'max_conn',
            dataType: SettingItemDataType.Number,
            value: '999',
        },
        {
            name: 'auto_restart',
            dataType: SettingItemDataType.Boolean,
            value: 'true',
        },
    ]

let repeatCount = 0

class MockDirectRpcCaller implements IDirectRpcCaller {
    public name: string
    public baseAddress: string
    public timeout: number

    public call({ moduleName, actionName, params, rawDest }: RpcCallerOptions): Promise<RpcResponse> {
        let s: any
        return new Promise((resolve, reject) => {
            const res: RpcResponse = {
                isSuccess: true,
                payload: null,
                from: 'MockConfigSvc',
                to: 'ThisSvc',
            }
            if (this.baseAddress == CONFIG_SVC_ADDRESSES[0]) {
                // Force to throw error on first address attempt.
                reject('Connection rejected!')
            } else if (this.baseAddress == CONFIG_SVC_ADDRESSES[1]) {
                // Force to fail on second attempt.
                res.isSuccess = false
                resolve(res)
            } else if (this.baseAddress == CONFIG_SVC_ADDRESSES[2]) {
                res.payload = SUCCESS_CONFIG
                repeatCount++

                if (repeatCount == 2) {
                    s = SUCCESS_CONFIG[1]
                    s['value'] += '_twice'
                } else if (repeatCount == 3) {
                    SUCCESS_CONFIG.splice(2, 1)
                } else if (repeatCount == 4) {
                    SUCCESS_CONFIG.push({
                        name: M.MSG_BROKER_PASSWORD,
                        dataType: SettingItemDataType.String,
                        value: BROKER_PASSWORD,
                    })
                } else if (repeatCount == 5) {
                    SUCCESS_CONFIG.push({
                        name: S.CONFIG_SERVICE_ADDRESSES,
                        dataType: SettingItemDataType.String,
                        value: JSON.stringify(['127.0.0.4']),
                    })
                }

                resolve(res)
            } else if (this.baseAddress == '127.0.0.4') {
                res.payload = SUCCESS_CONFIG
                repeatCount++
                s = SUCCESS_CONFIG[SUCCESS_CONFIG.length - 1]
                if (repeatCount == 6) {
                    s.value = JSON.stringify([])
                } else if (repeatCount == 7) {
                    s.value = '{malform-json'
                } else if (repeatCount == 8) {
                    // Unchanged
                } else if (repeatCount == 9) {
                    res.isSuccess = false
                } else {
                    s = SUCCESS_CONFIG[1]
                    s.value += '_tenth'
                    res.payload = SUCCESS_CONFIG
                }
                resolve(res)
            }
        })
    }

    public callImpatient({ moduleName, actionName, params, rawDest }: RpcCallerOptions): Promise<void> {
        return Promise.resolve()
    }

    public init(param: any): Promise<void> {
        return Promise.resolve()
    }

    public dispose(): Promise<void> {
        return Promise.resolve()
    }

    public onError(handler: (err: any) => void): void {
        // Empty
    }
}

describe('ConfigurationProvider', function () {
    // tslint:disable-next-line: no-invalid-this
    this.timeout(5000)
    // this.timeout(60000); // For debugging

    let configProvider: ConfigurationProviderAddOn

    beforeEach(() => {
        configProvider = new app.ConfigurationProviderAddOn()
        configProvider['_rpcCaller'] = new MockDirectRpcCaller()
    })

    afterEach(async () => {
        await configProvider.dispose()
    })

    describe('init', () => {
        it('should load file config', async () => {
            // Act
            await configProvider.init()

            // Assert
            expect(configProvider['_fileSettings']).to.be.not.null
        })

        it('should not load file settings if cannot load file', async () => {
            // Arrange
            configProvider.configFilePath = 'dummy.json'

            // Act
            await configProvider.init()

            // Assert
            expect(configProvider['_fileSettings']).to.be.empty
        })

        it('should throw error if there is no address for Settings Service', async () => {
            // Arrange
            let isSuccess = false

            // Make it no way to accidentially get a meaningful address.
            configProvider.configFilePath = 'dummy.json'
            configProvider['_remoteSettings'] = {}
            process.env[S.CONFIG_SERVICE_ADDRESSES] = ''

            // Act then assert
            try {
                configProvider.enableRemote = true
                await configProvider.init()
                isSuccess = true
            } catch (err) {
                expect(err).to.be.instanceOf(CriticalException)
                expect(err.message).to.equal('No address for Settings Service!')
            }
            expect(isSuccess).to.be.false
        })
    }) // END describe 'init'

    describe('get', () => {
        it('should read appconfig file and return value', async () => {
            // Arrange
            const appConfigs = require(
                path.resolve(process.cwd(), './dist/app/configs')
            )
            let value

            // Act
            await configProvider.init()
            value = configProvider.get(S.DEADLETTER_TIMEOUT)

            // Assert
            expect(value.isJust).to.be.true
            expect(value.value).to.equals(appConfigs[S.DEADLETTER_TIMEOUT])
        })

        it('should read settings from environment variable', async () => {
            // Arrange
            process.env[S.CONFIG_SERVICE_ADDRESSES] = '127.0.0.1'
            configProvider.configFilePath = 'dummy.json'

            // Act
            await configProvider.init()
            const value = configProvider.get(S.CONFIG_SERVICE_ADDRESSES)

            // Assert
            expect(value.isJust).to.be.true
            expect(value.value).to.equals(process.env[S.CONFIG_SERVICE_ADDRESSES])
        })

        it('should read settings from fetched Configuration Service', async () => {
            // Arrange
            const settings = { // Mock fetched config
                    [M.MSG_BROKER_HOST]: '127.0.0.1/rabbitmq',
                }
            let settingMb: Maybe<any>

            configProvider['_remoteSettings'] = settings

            // Act
            await configProvider.init()
            settingMb = configProvider.get(M.MSG_BROKER_HOST)

            // Assert
            expect(settingMb.isJust).to.be.true
            expect(settingMb.value).to.equals(settings[M.MSG_BROKER_HOST])
        })

        it('should return empty Maybe if cannot find setting for specified key', async () => {
            // Arrange
            const NO_EXIST_KEY = 'imaginary-key'
            let settingMb: Maybe<any>

            // Act
            await configProvider.init()
            settingMb = configProvider.get(NO_EXIST_KEY)

            // Assert
            expect(settingMb.isNothing).to.be.true
        })
    }) // END describe 'get'

    /* Disable until finish refactoring service-communication
    describe('fetch', () => {

        it('should try each address in the list until success', async () => {
            // Arrange
            // Mock config service addresses
            process.env[SvcS.CONFIG_SERVICE_ADDRESSES] = JSON.stringify(CONFIG_SVC_ADDRESSES);

            let value;

            // Act then assert
            configPrvd.enableRemote = true;
            await configPrvd.init();
            await configPrvd.fetch();
            value = configPrvd.get(MbS.MSG_BROKER_HOST);
            expect(value).to.equals(SUCCESS_CONFIG[1].value);
            await configPrvd.dispose();
        });

        it('should reject if no address in the list is accessible and private _settings must be an empty object', async () => {
            // Arrange
            // Mock config service addresses
            let addresses = ['127.0.0.1', '127.0.0.2'];
            process.env[SvcS.CONFIG_SERVICE_ADDRESSES] = JSON.stringify(addresses);

            // Mock function to make request to config service.
            let requestFn = function() {
                return new Promise((resolve, reject) => {
                    reject('Connection rejected!');
                });
            };

            let isSuccess = false;
            configPrvd['_requestMaker'] = requestFn;

            // Act then assert
                configPrvd.enableRemote = true;
            await configPrvd.init();
            try {
                await configPrvd.fetch();
                isSuccess = true;
                expect(isSuccess).to.be.false;
            } catch (err) {
                expect(isSuccess).to.be.false;
                expect(configPrvd['_remoteSettings']).to.be.empty;
                expect(err).to.be.not.null;
            } finally {
                await configPrvd.dispose();
            }
        });

        it('should keep updating new settings', function (done) {
            this.timeout(20000);

            // Arrange
            let callSpy = chai.spy(),
                value;

            // Mock config service addresses
            process.env[SvcS.CONFIG_SERVICE_ADDRESSES] = JSON.stringify(CONFIG_SVC_ADDRESSES);

            // Act then assert
            configPrvd.enableRemote = true;
            configPrvd.init()
                .then(() => {
                    configPrvd['_refetchInterval'] = 1000; // Update every second
                    configPrvd.onUpdate((changedKeys: string[]) => {
                        console.log('New keys: ', changedKeys);
                        if (repeatCount == 2) { // Change a setting value
                            expect(changedKeys).to.include(MbS.MSG_BROKER_HOST);
                            value = configPrvd.get(MbS.MSG_BROKER_HOST);
                            expect(value).to.contain('_twice');
                            callSpy();
                        } else if (repeatCount == 3) { // Remove a setting
                            expect(changedKeys).to.include(RpcS.RPC_CALLER_TIMEOUT);
                            value = configPrvd.get(RpcS.RPC_CALLER_TIMEOUT);
                            expect(value).not.to.exist;
                            callSpy();
                        } else if (repeatCount == 4) { // Add a new setting
                            expect(changedKeys).to.include(MbS.MSG_BROKER_PASSWORD);
                            value = configPrvd.get(MbS.MSG_BROKER_PASSWORD);
                            expect(value).to.equal(BROKER_PASSWORD);
                            callSpy();
                        } else if (repeatCount == 5) { // Not connectable new service addresses
                            expect(changedKeys).to.include(SvcS.CONFIG_SERVICE_ADDRESSES);
                            value = configPrvd['_addresses'];
                            expect(value).to.be.instanceOf(Array);
                            expect(value.length).to.equal(1);
                            expect(value[0]).to.equal('127.0.0.4');
                            callSpy();
                        } else if (repeatCount == 6) { // Empty new service addresses
                            expect(changedKeys).to.include(SvcS.CONFIG_SERVICE_ADDRESSES);
                            value = configPrvd['_addresses'];
                            // Switched back to previous addresses (still not connectable)
                            expect(value).to.be.instanceOf(Array);
                            expect(value.length).to.equal(1);
                            expect(value[0]).to.equal('127.0.0.4');
                            callSpy();
                        } else if (repeatCount == 10) {
                            expect(changedKeys).to.include(MbS.MSG_BROKER_HOST);
                            // Now the new addresses are working
                            value = configPrvd.get(MbS.MSG_BROKER_HOST);
                            expect(value).to.contain('_twice_tenth');

                            expect(callSpy).to.be.called.exactly(5);
                            configPrvd.dispose().then(() => done());
                        }
                    });
                    configPrvd.fetch();
                });

        });
    }); // END describe 'fetch'
    //*/

    describe('dispose', () => {
        it('should release all resources', async () => {
            // Arrange
            const configPrvd = new app.ConfigurationProviderAddOn(),
                callMe = chai.spy()
            configPrvd['_rpcCaller'] = new MockDirectRpcCaller()

            // Act
            await configPrvd.dispose()

            // Assert
            // tslint:disable-next-line:prefer-const
            for (let key in configPrvd) {
                if (key == 'name') { continue }
                callMe()
                expect(configPrvd[key], key).to.be.null
            }
            expect(callMe).to.be.called
        })
    }) // END describe 'dispose'
})
