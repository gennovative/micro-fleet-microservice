import { expect } from 'chai';
import { Guard, InvalidArgumentException } from '../../app';

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
				Guard.assertDefined('arg_1st', arg_1st);
			} catch (ex) {
				ex_1st = ex;
			}
			
			try {
				Guard.assertDefined('arg_2nd', arg_2nd);
			} catch (ex) {
				ex_2nd = ex;
			}
			
			try {
				Guard.assertDefined('arg_3rd', arg_3rd);
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
				Guard.assertDefined('arg_1st', arg_1st);
			} catch (ex) {
				ex_1st = ex;
			}

			try {
				Guard.assertDefined('arg_2nd', arg_2nd);
			} catch (ex) {
				ex_2nd = ex;
			}
			
			try {
				Guard.assertDefined('arg_3rd', arg_3rd);
			} catch (ex) {
				ex_3rd = ex;
			}

			// Assert
			expect(ex_1st).to.be.an.instanceOf(InvalidArgumentException);
			expect(ex_2nd).to.be.an.instanceOf(InvalidArgumentException);
			expect(ex_3rd).to.be.an.instanceOf(InvalidArgumentException);
		});
	});
});