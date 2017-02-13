import { expect } from 'chai';
import { MicroServiceBase } from '../../app';


class MicroService extends MicroServiceBase {

}

describe('MicroServiceBase', () => {
	describe('start', () => {
		it('should call events in specific order', () => {
			enum EventOrder { BeforeStart = 1, AfterStart, BeforeStop, AfterStop }

			let service = new MicroService(),
				i = 0;

			service.onStarting = () => {
				i++;
				expect(i).to.equal(<number>EventOrder.BeforeStart);
			};

			service.onStarted = () => {
				i++;
				expect(i).to.equal(<number>EventOrder.AfterStart);
			};

			service.onStopping  = () => {
				i++;
				expect(i).to.equal(<number>EventOrder.BeforeStop);
			};

			service.onStopped = () => {
				i++;
				expect(i).to.equal(<number>EventOrder.AfterStop);
			};

			service.start();
			expect(i).to.equal(<number>EventOrder.AfterStart);

			service.stop();
			expect(i).to.equal(<number>EventOrder.AfterStop);
		});
	});
});