import * as http from 'http';
import { expect } from 'chai';
import { ExpressHub } from '../../app';

const PORT = 34567;

describe('ExpressHub', () => {
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
			let hub = new ExpressHub();
			hub.use(require('./MicroWeb.dummy'));
			hub.listen(PORT, (err, server: http.Server) => {
				http.get(`http://localhost:${PORT}/dummy`, res => {
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