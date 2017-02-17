import * as http from 'http';
import { expect } from 'chai';
import { ExpressHub, IMicroWeb } from '../../app';

const PORT = 34567;

// TODO: Should give more details or comments to demonstrate how to use ExpressHub.

// Skipped. Because these tests start real HTTP server.
// Change `describe.skip(...)` to `describe(...)` to enable these tests.
describe.skip('ExpressHub', () => {
	describe('listen', () => {
		it('should answer requests to specified port', (done) => {
			let hub = new ExpressHub();
			hub.listen(PORT, async (err, server: http.Server) => {
				expect(err).to.be.not.null;
				expect(server.address().port).to.equal(PORT);
				await server.close();
				done();
			});
		});
	});

	describe('use', () => {
		it('should answer requests to specified path', (done) => {
			let hub = new ExpressHub(),
				microweb: IMicroWeb = require('./MicroWeb.dummy');
			hub.use(microweb);
			hub.listen(PORT, (err, server: http.Server) => {
				// Ex: http://localhost:3000/dummy
				http.get(`http://localhost:${PORT}/${microweb.name}`, res => {
					let str = '';

					// another chunk of data has been recieved, so append it to `str`
					res.on('data', (chunk) => {
						str += chunk;
					});

					// the whole response has been recieved, so we just print it out here
					res.on('end', async () => {
						let json = JSON.parse(str);
						expect(json.success).to.be.true;
						await server.close();
						done();
					});
				});
			});
		});
	});
});