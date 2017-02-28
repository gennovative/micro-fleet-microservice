import * as chai from 'chai';
import * as spies from 'chai-spies';
import { MicroServiceBase, IConfigurationProvider, IDatabaseAdapter,
	Types, CriticalException, injectable, DbClient, SettingKeys as S } from '../../app';

chai.use(spies);
const expect = chai.expect;

// BEGIN: FOR EXAMPLE PURPOSE

// In reality, should edit file /constants/Types.ts
const EXAMPLE_SVC = Symbol('IDummyService'),
	CUSTOM_ADT = Symbol('ICustomAdapter');


interface IExampleUtility { }
@injectable()
class ExampleUtility implements IExampleUtility { }


interface ICustomAdapter extends IAdapter { }

@injectable()
class CustomAdapter implements ICustomAdapter {	
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
	CONN_FILE = `${process.cwd()}/database-adapter-test.sqlite`;

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

	protected /* override */ registerDependencies(): void {
		super.registerDependencies();
		this._depContainer.bind<IExampleUtility>(EXAMPLE_SVC, ExampleUtility);
		this._depContainer.bind<ICustomAdapter>(CUSTOM_ADT, CustomAdapter);

		// In reality, we can merely call `registerConfigAdapter` method. However,
		// in this case, we want to inject our mock instance instead.
		//// this.registerConfigAdapter();
		this._depContainer.bind<IConfigurationProvider>(Types.CONFIG_ADAPTER, MockConfigService).asSingleton();
		
		// Call this if your service works directly with database.
		//this.registerDbAdapter();
		
		// Call this if your service communicates via message broker.
		// this.registerMessageBrokerAdapter();
		
		// Call this if your service needs to map between entities and DTO models.
		//this.registerModelMapper();
	}

	protected /* override */ onStarting(): void {
		// Call this if your service works directly with database.
		//this.addDbAdapter();

		// Call this if your service communicates via message broker.
		// this.addMessageBrokerAdapter();
		
		// Use this if you have a home-made adapter.
		// All added adapters' init method will be called 
		let customAdapter = this._depContainer.resolve<ICustomAdapter>(CUSTOM_ADT);
		this.addAdapter(customAdapter);
	}

	protected /* override */ onError(error: any): void {
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

			service['onError'] = function() {
				expect(service['onError']).to.be.spy;
				expect(service['onError']).to.be.called.once;
				expect(service['onError']).to.be.called.with(ERROR_FAIL);
				done();
			};

			chai.spy.on(service, 'onError');

			service['onStarting'] = function() {
				let cfgAdt = <MockConfigService>this['_depContainer'].resolve(Types.CONFIG_ADAPTER);
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
			
			service['onStarting'] = function() {
				let cfgAdt = <MockConfigService>this['_depContainer'].resolve(Types.CONFIG_ADAPTER);
				cfgAdt.behavior = BEHAV_THROW;
			};

			// Act
			service.start();
		});
	});
	
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
	});
	
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
			
			service['onStarting'] = () => {
				service['_adapters'].forEach((adt: IAdapter, idx) => {
					if (adt['clientName']) {
						// Search for database adapter and
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
	});
	
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
	});

	describe('stop', () => {
		it('should dispose all adapters', (done) => {
			// Arrange
			let service = new TestMarketingService(),
				adpArr = [];

			service['onStarting'] = (function(original) {
				return () => {
					// Save and execute original `onStarting` method,
					// to make it covered.
					original.apply(service);

					adpArr = service['_adapters'];
					adpArr.forEach((adt: IAdapter, idx) => {
						if (adt['clientName']) {
							// Search for database adapter and
							// tell it to work with testing Sqlite3 file.
							adt['clientName'] = DbClient.SQLITE3;
						}
					});
				};
			})(service['onStarting']);

			service['onStarted'] = () => {
				// Transform all dispose functions to spies
				adpArr.forEach((adt: IAdapter, idx) => {
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
						
			process.exit = chai.spy('process.exit', () => {
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

			service['disposeAdapters'] = () => {
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
			
			process.exit = chai.spy('process.exit', () => {
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
	});
});