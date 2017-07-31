import * as chai from 'chai';
import * as spies from 'chai-spies';
import { CriticalException, injectable } from 'back-lib-common-util';
import { DbClient } from 'back-lib-persistence';

import { MicroServiceBase, IConfigurationProvider, IDatabaseAddOn,
	Types, SettingKeys as S } from '../../app';


chai.use(spies);
const expect = chai.expect;

// BEGIN: FOR EXAMPLE PURPOSE

// In reality, should edit file /constants/Types.ts
const EXAMPLE_SVC = Symbol('IDummyService'),
	CUSTOM_ADT = Symbol('ICustomAddOn');


interface IExampleUtility { }
@injectable()
class ExampleUtility implements IExampleUtility { }


interface ICustomAddOn extends IServiceAddOn { }

@injectable()
class CustomAddOn implements ICustomAddOn {	
	public init(): Promise<void> {
		return new Promise<void>(resolve => {
			// Do some async stuff here
			resolve();
		});
	}

	public dispose(): Promise<void> {
		return new Promise<void>(resolve => {
			// Do some async stuff here
			resolve();
		});
	}
}

// END: FOR EXAMPLE PURPOSE

const BEHAV_FALSE = 'behav_false',
	BEHAV_THROW = 'behav_throw',
	ERROR_RANDOM = new CriticalException('A random error!'),
	ERROR_FAIL = new CriticalException('Fail to fetch configuration!'),
	CONN_FILE = `${process.cwd()}/database-addon-test.sqlite`;

@injectable()
class MockConfigService implements IConfigurationProvider {

	public behavior: string;
	
	get enableRemote(): boolean {
		return true;
	}

	public init(): Promise<void> {
		return Promise.resolve();
	}

	public dispose(): Promise<void> {
		return Promise.resolve();
	}

	public get(key: string): string {
		switch (key) {
			case S.DB_FILE: return CONN_FILE;
			default: return null;
		}
	}

	public async fetch(): Promise<boolean> {
		switch (this.behavior) {
			case BEHAV_FALSE:
				return Promise.resolve(false);
			case BEHAV_THROW:
				throw ERROR_RANDOM;
		}
		return Promise.resolve(true);
	}
}

class PlainService extends MicroServiceBase {
}

class TestMarketingService extends MicroServiceBase {
	
	/**
	 * @override
	 */
	protected registerDependencies(): void {
		super.registerDependencies();
		this._depContainer.bind<IExampleUtility>(EXAMPLE_SVC, ExampleUtility);
		this._depContainer.bind<ICustomAddOn>(CUSTOM_ADT, CustomAddOn);

		// In reality, we can merely call `registerConfigAddOn` method. However,
		// in this case, we want to inject our mock instance instead.
		//// this.registerConfigAddOn();
		this._depContainer.bind<IConfigurationProvider>(Types.CONFIG_PROVIDER, MockConfigService).asSingleton();
		
		// Call this if your service works directly with database.
		//this.registerDbAddOn();
		
		// Call this if your service communicates via message broker.
		// this.registerMessageBrokerAddOn();		
	}

	/**
	 * @override
	 */
	protected onStarting(): void {
		// Call this if your service works directly with database.
		//this.addDbAddOn();

		// Call this if your service communicates via message broker.
		// this.addMessageBrokerAddOn();
		
		// Use this if you have a home-made add-on.
		// All added add-ons' init method will be called 
		let customAddOn = this._depContainer.resolve<ICustomAddOn>(CUSTOM_ADT);
		this.attachAddOn(customAddOn);
	}

	/**
	 * @override
	 */
	protected onError(error: any): void {
		super.onError(error);
	}
}

// This code should be in file index.ts, located at root project folder, and executed by `npm start`.
//		let service = new DummyMarketingService();
//		service.start();


describe('MicroServiceBase', () => {
	describe('start', () => {
		it('should call events in specific order', () => {
			enum EventOrder { BeforeStart = 1, AfterStart, BeforeStop, AfterStop }

			let service = new PlainService(),
				i = 0;

			service['onStarting'] = () => {
				i++;
				expect(i).to.equal(<number>EventOrder.BeforeStart);
			};

			service['onStarted'] = () => {
				i++;
				expect(i).to.equal(<number>EventOrder.AfterStart);
				expect(service.isStarted, 'Service should be started by now').to.be.true;

				// When the service is fully started, stop it.
				service.stop(false);
			};

			service['onStopping']  = () => {
				i++;
				expect(i).to.equal(<number>EventOrder.BeforeStop);
			};

			service['onStopped'] = () => {
				i++;
				expect(i).to.equal(<number>EventOrder.AfterStop);
				expect(service.isStarted, 'Service should be stopped by now').to.be.false;
			};

			service.start();
		});

		it('should throw exception and catch with onError event if fetching configuration fails', (done) => {
			// Arrange
			let service = new TestMarketingService();

			service['onError'] = function(err: CriticalException) {
				expect(service['onError']).to.be.spy;
				expect(service['onError']).to.be.called.once;
				expect(err.message).to.equal(ERROR_FAIL.message);
				done();
			};

			chai.spy.on(service, 'onError');
			service['exitProcess'] = () => {};

			service['onStarting'] = function() {
				let cfgAdt = <MockConfigService>this['_depContainer'].resolve(Types.CONFIG_PROVIDER);
				cfgAdt.behavior = BEHAV_FALSE;
			};

			// Act
			service.start();
		});

		it('should catch all errors with onError event', (done) => {
			// Arrange
			let service = new TestMarketingService();
			
			service['onError'] = function() {
				// Assert
				expect(service['onError']).to.be.spy;
				expect(service['onError']).to.be.called.once;
				expect(service['onError']).to.be.called.with(ERROR_RANDOM);
				done();
			};

			chai.spy.on(service, 'onError');
			service['exitProcess'] = () => {};
			
			service['onStarting'] = function() {
				let cfgAdt = <MockConfigService>this['_depContainer'].resolve(Types.CONFIG_PROVIDER);
				cfgAdt.behavior = BEHAV_THROW;
			};

			// Act
			service.start();
		});
	}); // describe 'MicroServiceBase'
	
	describe('onStarting', () => {
		it('should catch all errors with onError event', (done) => {
			// Arrange
			let service = new PlainService();
			
			service['onError'] = (function(original) {
				return (error) => {
					// Save and execute original `onError` method,
					// to make it covered.
					original(error);

					// Assert
					expect(service['onError']).to.be.spy;
					expect(service['onError']).to.be.called.once;
					expect(service['onError']).to.be.called.with(ERROR_RANDOM);
					done();
				};
			})(service['onError']);

			service['exitProcess'] = () => {};

			chai.spy.on(service, 'onError');
			
			service['onStarting'] = (function(original) {
				return () => {
					// Save and execute original `onStarting` method,
					// to make it covered.
					original();
					throw ERROR_RANDOM;
				};
			})(service['onStarting']);

			// Act
			service.start();
		});
	}); // describe 'onStarting'
	
	describe('onStopping', () => {
		it('should catch all errors with onError event', (done) => {
			// Arrange
			let service = new TestMarketingService();
			
			service['onError'] = function() {
				// Assert
				expect(service['onError']).to.be.spy;
				expect(service['onError']).to.be.called.once;
				expect(service['onError']).to.be.called.with(ERROR_RANDOM);
				done();
			};

			chai.spy.on(service, 'onError');
			service['exitProcess'] = () => {};
			
			service['onStarting'] = () => {
				service['_addons'].forEach((adt: IServiceAddOn, idx) => {
					if (adt['clientName']) {
						// Search for database add-on and
						// tell it to work with testing Sqlite3 file.
						adt['clientName'] = DbClient.SQLITE3;
					}
				});
			};

			service['onStarted'] = (function(original) {
				return () => {
					original();
					service.stop(false);
				};
			})(service['onStarted']);
			
			
			service['onStopping'] = (function(original) {
				return () => {
					// Save and execute original `onStarting` method,
					// to make it covered.
					original();
					throw ERROR_RANDOM;
				};
			})(service['onStopping']);

			// Act
			service.start();
		});
	}); // describe 'onStopping'
	
	describe('onStopped', () => {
		it('should gracefully stop even when an error occurs', (done) => {
			// Arrange
			let service = new PlainService(),
				callMe = chai.spy();
			
			service['onError'] = function() {
				callMe();
			};
			
			service['exitProcess'] = () => {};

			service['onStarting'] = () => {
					throw ERROR_RANDOM;
				};

			service['onStarted'] = function() {
				service.stop(false);
			};

			service['onStopped'] = function() {
				// Assert
				expect(callMe).to.be.called.once;
				done();
			};

			// Act
			service.start();
		});
	}); // describe 'onStopped'

	describe('stop', () => {
		it('should dispose all add-ons', (done) => {
			// Arrange
			let service = new TestMarketingService(),
				adpArr = [];

			service['onStarting'] = (function(original) {
				return () => {
					// Save and execute original `onStarting` method,
					// to make it covered.
					original.apply(service);

					adpArr = service['_addons'];
					adpArr.forEach((adt: IServiceAddOn, idx) => {
						if (adt['clientName']) {
							// Search for database add-on and
							// tell it to work with testing Sqlite3 file.
							adt['clientName'] = DbClient.SQLITE3;
						}
					});
				};
			})(service['onStarting']);

			service['onStarted'] = () => {
				// Transform all dispose functions to spies
				adpArr.forEach((adt: IServiceAddOn, idx) => {
					//console.log(`SPY ${idx}:` + adt.constructor.toString().substring(0, 20));
					chai.spy.on(adt, 'dispose');
				});

				expect(service.isStarted, 'Service should be started by now').to.be.true;
				// When the service is fully started, stop it.
				service.stop(false);
			};

			service['onStopped'] = () => {
				expect(service.isStarted, 'Service should be stopped by now').to.be.false;
				adpArr.forEach((adt, idx) => {
					let adtName = adt.constructor.toString().substring(0, 20);
					expect(adt.dispose).to.be.spy;
					expect(adt.dispose, adtName).to.be.called.once;
				});
				done();
			};

			service.start();
			
		});

		it('should catch all errors with onError event and exit process', (done) => {
			// Arrange
			let service = new PlainService(),
				exitProcess = process.exit;
						
			process.exit = <any>chai.spy('process.exit', () => {
				// Assert
				expect(process.exit).to.be.spy;
				expect(process.exit).to.be.called.once;
				
				// Give back original function, because this is global function.
				process.exit = exitProcess;
				done();
			});
			
			service['onError'] = chai.spy((error) => {
				// Assert
				expect(service['onError']).to.be.spy;
				expect(service['onError']).to.be.called.once;
				expect(service['onError']).to.be.called.with(ERROR_RANDOM);
			});

			service['onStarted'] = () => {
				service.stop();
			};

			service['disposeAddOns'] = () => {
				return new Promise<void>((resolve, reject) => {
					reject(ERROR_RANDOM);
				});
			};

			// Act
			service.start();
		});

		it.skip('should gracefully shutdown on SIGTERM', (done) => {
			// Arrange
			let service = new PlainService(),
				exitProcess = process.exit;
			
			process.exit = <any>chai.spy('process.exit', () => {
				// Assert
				expect(process.exit).to.be.spy;
				expect(process.exit).to.be.called.once;
				
				// Give back original function, because this is global function.
				process.exit = exitProcess;
				done();
			});

			service['onStarted'] = () => {
				process.emit('SIGTERM');
			};
			
			// Act
			service.start();
		});
	}); // describe 'stop'
});