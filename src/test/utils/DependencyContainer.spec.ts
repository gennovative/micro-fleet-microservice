import { expect } from 'chai';
import { Container } from 'inversify';

import { injectable, inject, DependencyContainer, SettingKeys as C } from '../../app';

const NAME = 'gennova',
	IDENTIFIER = Symbol('abc');

interface IDummy {
	getName(): string;
}

@injectable()
class Dummy implements IDummy {
	constructor() {	
	}

	getName(): string {
		return NAME;
	}
}

describe('DependencyContainer', () => {
	describe('bind', () => {
		it('should register dependency to internal container, with string identifier', () => {
			// Arrange
			let container = new DependencyContainer(),
				internalContainer: Container = container['_container'],
				resolveInstance: IDummy;
			
			// Act
			container.bind<IDummy>('abc', Dummy); // String identifier

			// Assert
			resolveInstance = internalContainer.get<IDummy>('abc');
			expect(resolveInstance).to.be.not.null;
			expect(resolveInstance.getName()).to.equal(NAME);
		});
		
		it('should register dependency to internal container, with symbol identifier', () => {
			// Arrange
			let container = new DependencyContainer(),
				internalContainer: Container = container['_container'],
				resolveInstance: IDummy;
			
			// Act
			container.bind<IDummy>(IDENTIFIER, Dummy); // Symbol identifier

			// Assert
			resolveInstance = internalContainer.get<IDummy>(IDENTIFIER);
			expect(resolveInstance).to.be.not.null;
			expect(resolveInstance.getName()).to.equal(NAME);
		});
		
		it('should return same instance everytime, when registering as singleton', () => {
			// Arrange
			let container = new DependencyContainer(),
				internalContainer: Container = container['_container'];
			
			// Act
			container.bind<IDummy>(IDENTIFIER, Dummy).asSingleton();

			// Assert
			let instance_1st = internalContainer.get<IDummy>(IDENTIFIER),
				instance_2nd = internalContainer.get<IDummy>(IDENTIFIER),
				instance_3rd = internalContainer.get<IDummy>(IDENTIFIER);

			expect(instance_1st).to.be.not.null;
			expect(instance_2nd).to.be.not.null;
			expect(instance_3rd).to.be.not.null;

			expect(instance_1st).to.equal(instance_2nd); // instance_1st === instance_2nd
			expect(instance_1st).to.equal(instance_3rd); // instance_1st === instance_3rd
			expect(instance_2nd).to.equal(instance_3rd); // instance_2nd === instance_3rd

			expect(instance_1st.getName()).to.equal(NAME);
			expect(instance_2nd.getName()).to.equal(NAME);
			expect(instance_3rd.getName()).to.equal(NAME);
		});
		
		it('should create new instance everytime, when registering as transient', () => {
			// Arrange
			let container = new DependencyContainer(),
				internalContainer: Container = container['_container'];
			
			// Act
			container.bind<IDummy>(IDENTIFIER, Dummy).asTransient(); // Default behavior

			// Assert
			let instance_1st = internalContainer.get<IDummy>(IDENTIFIER),
				instance_2nd = internalContainer.get<IDummy>(IDENTIFIER),
				instance_3rd = internalContainer.get<IDummy>(IDENTIFIER);

			expect(instance_1st).to.be.not.null;
			expect(instance_2nd).to.be.not.null;
			expect(instance_3rd).to.be.not.null;

			expect(instance_1st).to.not.equal(instance_2nd); // instance_1st !== instance_2nd
			expect(instance_1st).to.not.equal(instance_3rd); // instance_1st !== instance_3rd
			expect(instance_2nd).to.not.equal(instance_3rd); // instance_2nd !== instance_3rd

			expect(instance_1st.getName()).to.equal(NAME);
			expect(instance_2nd.getName()).to.equal(NAME);
			expect(instance_3rd.getName()).to.equal(NAME);
		});
	});
	
	describe('resolve', () => {
		it('should get dependency from internal container', () => {
			// Arrange
			let container = new DependencyContainer(),
				internalContainer: Container = container['_container'],
				resolveInstance: IDummy;
			
			// Act
			internalContainer.bind<IDummy>(IDENTIFIER).to(Dummy);

			// Assert
			resolveInstance = container.resolve<IDummy>(IDENTIFIER);
			expect(resolveInstance).to.be.not.null;
			expect(resolveInstance.getName()).to.equal(NAME);
		});
		
		it('should return null if no dependency is found', () => {
			// Arrange
			let container = new DependencyContainer(),
				resolveInstance: IDummy;
			
			// Act
			resolveInstance = container.resolve<IDummy>(IDENTIFIER);

			// Assert
			expect(resolveInstance).to.be.null;
		});
	});
	
	describe('dispose', () => {
		it('should throw exception if called after disposal', () => {
			// Arrange
			let container = new DependencyContainer();
			container.bind<IDummy>(IDENTIFIER, Dummy);
			
			// Act
			container.dispose();

			// Assert
			let exception = null;
			try {
				container.resolve<IDummy>(IDENTIFIER);
			} catch (ex) {
				exception = ex;
			}
			
			expect(exception).to.be.not.null;
			expect(exception).to.equal('Container has been disposed!');
		});
	});
});