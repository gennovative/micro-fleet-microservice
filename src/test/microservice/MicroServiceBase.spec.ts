import * as chai from 'chai';
import * as spies from 'chai-spies';
import { MicroServiceBase, IAdapter, IConfigurationAdapter, 
	Types, CriticalException, injectable } from '../../app';

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
	public init(): Promise<boolean> {
		// Do some async stuff here
		return Promise.resolve(true);
	}
}

// END: FOR EXAMPLE PURPOSE

const BEHAV_FALSE = 'behav_false',
	BEHAV_THROW = 'behav_throw',
	ERROR_RANDOM = new CriticalException('A random error!'),
	ERROR_FAIL = new CriticalException('Fail to fetch configuration!');

@injectable()
class MockConfigService implements IConfigurationAdapter {

	public behavior: string;
	
	get enableRemote(): boolean {
		return true;
	}

	public init(): Promise<boolean> {
		return Promise.resolve(true);
	}

	public get(key: string): string {
		return null;
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
		this._depContainer.bind<IConfigurationAdapter>(Types.CONFIG_ADAPTER, MockConfigService).asSingleton();
		let adt = this._depContainer.resolve<IConfigurationAdapter>(Types.CONFIG_ADAPTER);
	}

	protected /* override */ onStarting(): void {
		// Call this if your service works directly with database.
		super.addDbAdapter();

		// Call this if your service communicates via message broker.
		// this.addMessageBrokerAdapter(); // Not implemented yet :)
		
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
				expect(service['onError']).to.be.spy;
				expect(service['onError']).to.be.called.once;
				expect(service['onError']).to.be.called.with(ERROR_RANDOM);
				done();
			};

			chai.spy.on(service, 'onError');
			
			service['onStopping'] = (function(original) {
				return () => {
					// Save and execute original `onStarting` method,
					// to make it covered.
					original();
					throw ERROR_RANDOM;
				};
			})(service['onStopping']);

			service['onStarted'] = (function(original) {
				return () => {
					original();
					service.stop(false);
				};
			})(service['onStarted']);
			
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
				expect(callMe).to.be.called.once;
				done();
			};

			// Act
			service.start();
		});
	});
});