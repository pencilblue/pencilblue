'use strict';

//dependencies
var RegExpUtils = require('../../../include/utils/reg_exp_utils');

describe('RegExpUtils', function() {

    describe('escape', function() {

        it ('should escape characters that are special to regular expressions', function() {
            RegExpUtils.escape('^$\\*.').should.eql('\\^\\$\\\\\\*\\.');
        });
    });

    describe('getCaseInsensitiveAny', function() {

        it('should create an expression that will search anywhere in a string for the provided sequence', function() {
            RegExpUtils.getCaseInsensitiveAny('hello^world').toString().should.eql('/hello\\^world.*/i');
        });
    });

    describe('getCaseInsensitiveExact', function() {

        it('should create an expression that will search force the provided sequence to match the entire string in order to match', function() {
            RegExpUtils.getCaseInsensitiveExact('hello^world').toString().should.eql('/^hello\\^world$/i');
        });
    });
});
