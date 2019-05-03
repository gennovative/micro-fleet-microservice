import * as chai from 'chai'
import * as spies from 'chai-spies'
import * as _ from 'lodash'
import { CriticalException, SettingItem, SettingItemDataType,
    IConfigurationProvider, constants } from '@micro-fleet/common'
const { RpcSettingKeys: RpcS, SvcSettingKeys: SvcS, MbSettingKeys: MbS } = constants

import { IDirectRpcCaller, IRpcResponse } from '@micro-fleet/service-communication'

import * as app from '../../app'


chai.use(spies)
const expect = chai.expect

// Mock fetched config

const CONFIG_SVC_ADDRESSES = ['127.0.0.1', '127.0.0.2', '127.0.0.3'],
    BROKER_PASSWORD = 'secret',
    SUCCESS_CONFIG: SettingItem[] = [
        {
            name: SvcS.SETTINGS_SERVICE_ADDRESSES,
            dataType: SettingItemDataType.String,
            value: JSON.stringify(CONFIG_SVC_ADDRESSES),
        },
        {
            name: MbS.MSG_BROKER_HOST,
            dataType: SettingItemDataType.String,
            value: '127.0.0.1/rabbitmq',
        },
        {
            name: RpcS.RPC_CALLER_TIMEOUT,
            dataType: SettingItemDataType.Number,
            value: '1000',
        },
        {
            name: SvcS.SETTINGS_REFETCH_INTERVAL,
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

    public call(moduleName: string, action: string, params: any): Promise<IRpcResponse> {
        let s: any
        return new Promise((resolve, reject) => {
            const res: IRpcResponse = {
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
                        name: MbS.MSG_BROKER_PASSWORD,
                        dataType: SettingItemDataType.String,
                        value: BROKER_PASSWORD,
                    })
                } else if (repeatCount == 5) {
                    SUCCESS_CONFIG.push({
                        name: SvcS.SETTINGS_SERVICE_ADDRESSES,
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
    this.timeout(5000)
    // this.timeout(60000); // For debugging

    let globalConfigPrvd: IConfigurationProvider

    beforeEach(() => {
        globalConfigPrvd = new app.ConfigurationProvider()
        globalConfigPrvd['_rpcCaller'] = new MockDirectRpcCaller()
    })

    afterEach(async () => {
        await globalConfigPrvd.dispose()
    })

    describe('init', () => {
        it('should load file config', async () => {
            // Act
            await globalConfigPrvd.init()

            // Assert
            expect(globalConfigPrvd['_fileSettings']).to.be.not.null
        })

        it('should not load file settings if cannot load file', async () => {
            // Arrange
            globalConfigPrvd['_configFilePath'] = 'dummy.json'

            // Act
            await globalConfigPrvd.init()

            // Assert
            expect(globalConfigPrvd['_fileSettings']).to.be.empty
        })

        it('should throw error if there is no address for Settings Service', async () => {
            // Arrange
            let isSuccess = false

            // Make it no way to accidentially get a meaningful address.
            globalConfigPrvd['_configFilePath'] = 'dummy.json'
            globalConfigPrvd['_remoteSettings'] = {}
            process.env[SvcS.SETTINGS_SERVICE_ADDRESSES] = ''

            // Act then assert
            try {
                globalConfigPrvd.enableRemote = true
                await globalConfigPrvd.init()
                isSuccess = true
            } catch (err) {
                expect(err).to.be.instanceOf(CriticalException)
                expect(err.message).to.equal('No address for Settings Service!')
            }
            expect(isSuccess).to.be.false
        })
    }) // END describe 'init'

    describe('get enableRemote', () => {
        it('should return value of `enableRemote`', () => {
            // Act and assert
            globalConfigPrvd['_enableRemote'] = false
            expect(globalConfigPrvd.enableRemote).to.be.false

            globalConfigPrvd['_enableRemote'] = true
            expect(globalConfigPrvd.enableRemote).to.be.true

        })
    }) // END describe 'get enableRemote'

    describe('set enableRemote', () => {
        it('should set value for `enableRemote`', () => {
            // Act and assert
            globalConfigPrvd.enableRemote = false
            expect(globalConfigPrvd['_enableRemote']).to.be.false

            globalConfigPrvd.enableRemote = true
            expect(globalConfigPrvd['_enableRemote']).to.be.true

        })
    }) // END describe 'set enableRemote'

    describe('get', () => {
        it('should read appconfig.json and return value', async () => {
            // Arrange
            const appConfigs = require('../../../appconfig.json')
            let value

            // Act
            await globalConfigPrvd.init()
            value = globalConfigPrvd.get(SvcS.ADDONS_DEADLETTER_TIMEOUT)

            // Assert
            expect(value.hasValue).to.be.true
            expect(value.value).to.equals(appConfigs[SvcS.ADDONS_DEADLETTER_TIMEOUT])
        })

        it('should read settings from environment variable', async () => {
            // Arrange
            process.env[SvcS.SETTINGS_SERVICE_ADDRESSES] = '127.0.0.1'
            globalConfigPrvd['_configFilePath'] = 'dummy.json'

            // Act
            await globalConfigPrvd.init()
            const value = globalConfigPrvd.get(SvcS.SETTINGS_SERVICE_ADDRESSES)

            // Assert
            expect(value.hasValue).to.be.true
            expect(value.value).to.equals(process.env[SvcS.SETTINGS_SERVICE_ADDRESSES])
        })

        it('should read settings from fetched Configuration Service', async () => {
            // Arrange
            const settings = { // Mock fetched config
                    [MbS.MSG_BROKER_HOST]: '127.0.0.1/rabbitmq',
                }
            let value

            globalConfigPrvd['_remoteSettings'] = settings

            // Act
            await globalConfigPrvd.init()
            value = globalConfigPrvd.get(MbS.MSG_BROKER_HOST)

            // Assert
            expect(value.hasValue).to.be.true
            expect(value.value).to.equals(settings[MbS.MSG_BROKER_HOST])
        })

        it('should return empty Maybe if cannot find setting for specified key', async () => {
            // Arrange
            const NO_EXIST_KEY = 'imaginary-key'
            let value

            // Act
            await globalConfigPrvd.init()
            value = globalConfigPrvd.get(NO_EXIST_KEY)

            // Assert
            expect(value.hasValue).to.be.false
        })
    }) // END describe 'get'

    /* Disable untile finish refactoring service-communication
    describe('fetch', () => {

        it('should try each address in the list until success', async () => {
            // Arrange
            // Mock config service addresses
            process.env[SvcS.SETTINGS_SERVICE_ADDRESSES] = JSON.stringify(CONFIG_SVC_ADDRESSES);

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
            process.env[SvcS.SETTINGS_SERVICE_ADDRESSES] = JSON.stringify(addresses);

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
            process.env[SvcS.SETTINGS_SERVICE_ADDRESSES] = JSON.stringify(CONFIG_SVC_ADDRESSES);

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
                            expect(changedKeys).to.include(SvcS.SETTINGS_SERVICE_ADDRESSES);
                            value = configPrvd['_addresses'];
                            expect(value).to.be.instanceOf(Array);
                            expect(value.length).to.equal(1);
                            expect(value[0]).to.equal('127.0.0.4');
                            callSpy();
                        } else if (repeatCount == 6) { // Empty new service addresses
                            expect(changedKeys).to.include(SvcS.SETTINGS_SERVICE_ADDRESSES);
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
            const configPrvd = new app.ConfigurationProvider(),
                callMe = chai.spy()
            configPrvd['_rpcCaller'] = new MockDirectRpcCaller()

            // Act
            await configPrvd.dispose()

            // Assert
            _.forOwn(configPrvd, (value: any, key: string) => {
                if (key == 'name') { return }
                callMe()
                expect(configPrvd[key], key).to.be.null
            })
            expect(callMe).to.be.called
        })
    }) // END describe 'dispose'
})
