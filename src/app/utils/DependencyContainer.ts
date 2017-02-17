import { injectable, inject, Container, interfaces } from 'inversify';
import { Guard } from './Guard';

export { injectable, inject };

class BindingScope<T> {
	
	constructor(private _binding: interfaces.BindingInWhenOnSyntax<T>) {
		
	}

	asSingleton(): void {
		this._binding.inSingletonScope();
	}

	asTransient(): void {
		this._binding.inTransientScope();
	}
}

export class DependencyContainer {
	private _container: Container;

	constructor() {
		this._container = new Container();
	}

	public bind<TInterface>(identifier: string | symbol, constructor: interfaces.Newable<TInterface>): BindingScope<TInterface> {
		this.assertNotDisposed();
		Guard.assertDefined('constructor', constructor);
		
		let container = this._container,
			binding, scope;
		
		if (container.isBound(identifier)) {
			container.unbind(identifier);
		}

		binding = this._container.bind<TInterface>(identifier).to(constructor);
		scope = new BindingScope<TInterface>(binding);

		return scope;
	}

	public resolve<T>(identifier: string | symbol): T {
		this.assertNotDisposed();
		try {
			return this._container.get<T>(identifier);
		} catch (ex) {
			console.log('Resolve Error: ' + ex);
			return null;
		}
	}

	public dispose(): void {
		this._container.unbindAll();
		this._container = null;
	}

	private assertNotDisposed() {
		if (!this._container) {
			throw 'Container has been disposed!';
		}
	}
}