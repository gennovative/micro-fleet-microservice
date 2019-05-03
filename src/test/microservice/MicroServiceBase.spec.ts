import * as chai from 'chai'
import * as spies from 'chai-spies'
import { CriticalException, injectable, IConfigurationProvider,
    Types, Maybe, constants } from '@micro-fleet/common'
const { DbClient, SvcSettingKeys: SvcS } = constants

import { MicroServiceBase } from '../../app'
// import rabbitOpts from '../rabbit-options';
// import DB_DETAILS from '../database-details';


chai.use(spies)
const expect = chai.expect

// BEGIN: FOR EXAMPLE PURPOSE

// In reality, should edit file /constants/Types.ts
const EXAMPLE_SVC = Symbol('IDummyService'),
    CUSTOM_ADT = Symbol('ICustomAddOn')


interface IExampleUtility { }
@injectable()
class ExampleUtility implements IExampleUtility { }


interface ICustomAddOn extends IServiceAddOn { }

@injectable()
class CustomAddOn implements ICustomAddOn {

    public readonly name: string = 'CustomAddOn'

    public init(): Promise<void> {
        return new Promise<void>(resolve => {
            // Do some async stuff here
            resolve()
        })
    }

    public deadLetter(): Promise<void> {
        return Promise.resolve()
    }

    public dispose(): Promise<void> {
        return new Promise<void>(resolve => {
            // Do some async stuff here
            resolve()
        })
    }
}

// END: FOR EXAMPLE PURPOSE

const BEHAV_FALSE = 'behav_false',
    BEHAV_THROW = 'behav_throw',
    ERROR_RANDOM = new CriticalException('A random error!'),
    ERROR_FAIL = new CriticalException('Fail to fetch configuration!')

@injectable()
class MockConfigProvider implements IConfigurationProvider {

    public readonly name: string = 'MockConfigProvider'

    public behavior: string

    get enableRemote(): boolean {
        return true
    }

    public init(): Promise<void> {
        return Promise.resolve()
    }

    public deadLetter(): Promise<void> {
        return Promise.resolve()
    }

    public dispose(): Promise<void> {
        return Promise.resolve()
    }

    public onUpdate(listener: (changedKeys: string[]) => void) {
        // Empty
    }

    public get(key: string): Maybe<number | boolean | string> {
        switch (key) {
            case SvcS.ADDONS_DEADLETTER_TIMEOUT: return new Maybe(1000)
            default: return new Maybe
        }
    }

    public async fetch(): Promise<boolean> {
        switch (this.behavior) {
            case BEHAV_FALSE:
                return Promise.resolve(false)
            case BEHAV_THROW:
                throw ERROR_RANDOM
        }
        return Promise.resolve(true)
    }
}

class PlainService extends MicroServiceBase {
}

class TestMarketingService extends MicroServiceBase {

    /**
     * @override
     */
    protected registerDependencies(): void {
        super.registerDependencies()
        this._depContainer.bind<IExampleUtility>(EXAMPLE_SVC, ExampleUtility)
        this._depContainer.bind<ICustomAddOn>(CUSTOM_ADT, CustomAddOn)

        // `registerConfigProvider()` is already called by MicroServiceBase.
        // However, in this case, we want to override with our mock instance.
        this._depContainer.bind<IConfigurationProvider>(Types.CONFIG_PROVIDER, MockConfigProvider).asSingleton()

        // Call this if your service works directly with database.
        // this.registerDbAddOn();

        // If your service accepts direct incoming requests.
        // this.registerDirectRpcHandler();

        // If your service sends direct incoming requests.
        //// Already called by MicroServiceBase
        // this.registerDirectRpcCaller();

        // If your service communicates via message broker.
        //// Internally called by `registerMediateRpcCaller` and `registerMediateRpcHandler`
        // this.registerMessageBrokerAddOn();

        // If your service sends requests via message broker.
        // this.registerMediateRpcCaller();

        // If your service accepts incoming requests via message broker.
        // this.registerMediateRpcHandler();
    }

    /**
     * @override
     */
    protected onStarting(): void {
        // Call this if your service works directly with database.
        // this.attachDbAddOn();

        // Call this if your service communicates via message broker.
        // this.attachMessageBrokerAddOn();

        // Use this if you have a home-made add-on.
        // All added add-ons' init method will be called
        const customAddOn = this._depContainer.resolve<ICustomAddOn>(CUSTOM_ADT)
        this.attachAddOn(customAddOn)
    }

    /**
     * @override
     */
    protected onError(error: any): void {
        super.onError(error)
    }
}

// This code should be in file index.ts, located at root project folder, and executed by `npm start`.
//        let service = new DummyMarketingService();
//        service.start();


describe('MicroServiceBase', function() {
    // this.timeout(10000);
    this.timeout(60000) // For debugging

    describe('start', () => {
        it('should call events in specific order', () => {
            enum EventOrder { BeforeStart = 1, AfterStart, BeforeStop, AfterStop }

            const service = new PlainService()
            let i = 0

            service['onStarting'] = () => {
                i++
                expect(i).to.equal(<number>EventOrder.BeforeStart)
            }

            service['onStarted'] = () => {
                i++
                expect(i).to.equal(<number>EventOrder.AfterStart)
                expect(service.isStarted, 'Service should be started by now').to.be.true

                // When the service is fully started, stop it.
                service.stop(false)
            }

            service['onStopping']  = () => {
                i++
                expect(i).to.equal(<number>EventOrder.BeforeStop)
            }

            service['onStopped'] = () => {
                i++
                expect(i).to.equal(<number>EventOrder.AfterStop)
                expect(service.isStarted, 'Service should be stopped by now').to.be.false
            }

            service.start()
        })

        it('should throw exception and catch with onError event if fetching configuration fails', (done) => {
            // Arrange
            const service = new TestMarketingService()

            service['onError'] = function(err: CriticalException) {
                expect(service['onError']).to.be.spy
                expect(service['onError']).to.be.called.once
                expect(err.message).to.equal(ERROR_FAIL.message)
                done()
            }

            chai.spy.on(service, 'onError')
            service['exitProcess'] = () => { /* Empty */ }

            service['onStarting'] = function() {
                const cfgAdt = <MockConfigProvider>this['_depContainer'].resolve(Types.CONFIG_PROVIDER)
                cfgAdt.behavior = BEHAV_FALSE
            }

            // Act
            service.start()
        })

        it('should catch all errors with onError event', (done) => {
            // Arrange
            const service = new TestMarketingService()

            service['onError'] = function() {
                // Assert
                expect(service['onError']).to.be.spy
                expect(service['onError']).to.be.called.once
                expect(service['onError']).to.be.called.with(ERROR_RANDOM)
                done()
            }

            chai.spy.on(service, 'onError')
            service['exitProcess'] = () => { /* Empty */ }

            service['onStarting'] = function() {
                const cfgAdt = <MockConfigProvider>this['_depContainer'].resolve(Types.CONFIG_PROVIDER)
                cfgAdt.behavior = BEHAV_THROW
            }

            // Act
            service.start()
        })
    }) // describe 'MicroServiceBase'

    describe('onStarting', () => {
        it('should catch all errors with onError event', (done) => {
            // Arrange
            const service = new PlainService()

            service['onError'] = (function(original) {
                return (error: any) => {
                    // Save and execute original `onError` method,
                    // to make it covered.
                    original.call(service, error)

                    // Assert
                    expect(service['onError']).to.be.spy
                    expect(service['onError']).to.be.called.once
                    expect(service['onError']).to.be.called.with(ERROR_RANDOM)
                    done()
                }
            })(service['onError'])

            service['exitProcess'] = () => { /* Empty */ }

            chai.spy.on(service, 'onError')

            service['onStarting'] = (function(original) {
                return () => {
                    // Save and execute original `onStarting` method,
                    // to make it covered.
                    original.call(service)
                    throw ERROR_RANDOM
                }
            })(service['onStarting'])

            // Act
            service.start()
        })
    }) // describe 'onStarting'

    describe('onStopping', () => {
        it('should catch all errors with onError event', (done) => {
            // Arrange
            const service = new TestMarketingService()

            service['onError'] = function() {
                // Assert
                expect(service['onError']).to.be.spy
                expect(service['onError']).to.be.called.once
                expect(service['onError']).to.be.called.with(ERROR_RANDOM)
                done()
            }

            chai.spy.on(service, 'onError')
            service['exitProcess'] = () => { /* Empty */ }

            service['onStarting'] = () => {
                service['_addons'].forEach((adt: IServiceAddOn, idx) => {
                    if (adt['clientName']) {
                        // Search for database add-on and
                        // tell it to work with testing Sqlite3 file.
                        adt['clientName'] = DbClient.SQLITE3
                    }
                })
            }

            service['onStarted'] = (function(original) {
                return () => {
                    original.apply(service)
                    service.stop(false)
                }
            })(service['onStarted'])


            service['onStopping'] = (function(original) {
                return () => {
                    // Save and execute original `onStarting` method,
                    // to make it covered.
                    original.apply(service)
                    throw ERROR_RANDOM
                }
            })(service['onStopping'])

            // Act
            service.start()
        })
    }) // describe 'onStopping'

    describe('onStopped', () => {
        it('should gracefully stop even when an error occurs', (done) => {
            // Arrange
            const service = new PlainService(),
                callMe = chai.spy()


            service['onError'] = function() {
                callMe()
            }

            service['exitProcess'] = () => { /* Empty */ }

            service['onStarted'] = function() {
                throw ERROR_RANDOM
            }

            service['onStopped'] = function() {
                // Assert
                expect(callMe).to.be.called.once
                done()
            }

            // Act
            service.start()
        })
    }) // describe 'onStopped'

    describe('stop', () => {
        it('should dispose all add-ons', (done) => {
            // Arrange
            const service = new TestMarketingService()
            let adpArr: any[] = []

            service['onStarting'] = (function(original) {
                return () => {
                    // Save and execute original `onStarting` method,
                    // to make it covered.
                    original.apply(service)

                    adpArr = service['_addons']
                    adpArr.forEach((adt: IServiceAddOn, idx) => {
                        if (adt['clientName']) {
                            // Search for database add-on and
                            // tell it to work with testing Sqlite3 file.
                            adt['clientName'] = DbClient.SQLITE3
                        }
                    })
                }
            })(service['onStarting'])

            service['onStarted'] = () => {
                // Transform all dispose functions to spies
                adpArr.forEach((adt: IServiceAddOn, idx) => {
                    // console.log(`SPY ${idx}:` + adt.constructor.toString().substring(0, 20));
                    chai.spy.on(adt, 'dispose')
                })

                expect(service.isStarted, 'Service should be started by now').to.be.true
                // When the service is fully started, stop it.
                service.stop(false)
            }

            service['onStopped'] = () => {
                expect(service.isStarted, 'Service should be stopped by now').to.be.false
                adpArr.forEach((adt, idx) => {
                    const adtName = adt.constructor.toString().substring(0, 20)
                    expect(adt.dispose).to.be.spy
                    expect(adt.dispose, adtName).to.be.called.once
                })
                done()
            }

            service.start()

        })

        it('should catch all errors with onError event and exit process', (done) => {
            // Arrange
            const service = new PlainService(),
                exitProcess = process.exit

            process.exit = <any>chai.spy('process.exit', () => {
                // Assert
                expect(process.exit).to.be.spy
                expect(process.exit).to.be.called.once

                // Give back original function, because this is global function.
                process.exit = exitProcess
                done()
            })

            service['onError'] = chai.spy(() => {
                // Assert
                expect(service['onError']).to.be.spy
                expect(service['onError']).to.be.called.once
                expect(service['onError']).to.be.called.with(ERROR_RANDOM)
            })

            service['onStarted'] = () => {
                service.stop()
            }

            service['disposeAddOns'] = () => {
                return new Promise<void[]>((resolve, reject) => {
                    reject(ERROR_RANDOM)
                })
            }

            // Act
            service.start()
        })

        it.skip('should gracefully shutdown on SIGTERM', (done) => {
            // Arrange
            const service = new PlainService(),
                exitProcess = process.exit

            process.exit = <any>chai.spy('process.exit', () => {
                // Assert
                expect(process.exit).to.be.spy
                expect(process.exit).to.be.called.once

                // Give back original function, because this is global function.
                process.exit = exitProcess
                done()
            })

            service['onStarted'] = () => {
                process.emit('SIGTERM' as any)
            }

            // Act
            service.start()
        })
    }) // describe 'stop'
})
