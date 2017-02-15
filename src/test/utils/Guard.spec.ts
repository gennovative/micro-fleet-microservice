import { expect } from 'chai';
import { Guard } from '../../app';

describe('Guard', () => {	
	describe('assertDefined', () => {
		it('should do nothing if argument is defined', () => {
			// Arrange
			let arg_1st = 0,
				arg_2nd = {},
				arg_3rd = [],
				ex_1st, ex_2nd, ex_3rd;
			
			// Act
			try {
				Guard.assertDefined(arg_1st);
			} catch (ex) {
				ex_1st = ex;
			}
			
			try {
				Guard.assertDefined(arg_2nd);
			} catch (ex) {
				ex_2nd = ex;
			}
			
			try {
				Guard.assertDefined(arg_3rd);
			} catch (ex) {
				ex_3rd = ex;
			}

			// Assert
			expect(ex_1st).to.be.undefined;
			expect(ex_2nd).to.be.undefined;
			expect(ex_3rd).to.be.undefined;
		});

		it('should throw exception if argument is null or undefined', () => {
			// Arrange
			let arg_1st = null,
				arg_2nd = undefined,
				arg_3rd, ex_1st, ex_2nd, ex_3rd;
			
			// Act
			try {
				Guard.assertDefined(arg_1st);
			} catch (ex) {
				ex_1st = ex;
			}
			
			try {
				Guard.assertDefined(arg_2nd);
			} catch (ex) {
				ex_2nd = ex;
			}
			
			try {
				Guard.assertDefined(arg_3rd);
			} catch (ex) {
				ex_3rd = ex;
			}

			// Assert
			expect(ex_1st).to.be.not.null;
			expect(ex_2nd).to.be.not.null;
			expect(ex_3rd).to.be.not.null;
			
			const MSG = 'Argument must not be null or undefined.';
			expect(ex_1st).to.equal(MSG);
			expect(ex_2nd).to.equal(MSG);
			expect(ex_3rd).to.equal(MSG);

		});
	});
});