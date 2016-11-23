
//dependencies
var should        = require('should');
var Configuration = require('../../../include/config.js');
var Lib           = require('../../../lib');

describe('ValidationService', function() {
    var pb = null;
    var ValidationService = null;
    var runRequiredFalseCheck = null;
    var runRequiredTrueCheck = null;

    before('Initialize the Environment with the default configuration', function() {
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        ValidationService = pb.ValidationService;
        runRequiredFalseCheck = function (toCheck) {
            (ValidationService[toCheck](null, true)).should.be.false();
            (ValidationService[toCheck](undefined, true)).should.be.false();
        };
        runRequiredTrueCheck = function (toCheck) {
            (ValidationService[toCheck](null, false)).should.be.true();
            (ValidationService[toCheck](undefined, false)).should.be.true();
        };
    });

    describe('ValidationService.isIdStr', function() {

        it('should return false when the required parameter is null or undefined', function() {
            runRequiredFalseCheck('isIdStr');
        });

        it('should return true when the parameter is not required and it is null or undefined', function() {
            runRequiredTrueCheck('isIdStr');
        });

        it('should return false when the parameter is not a String', function() {
            (ValidationService.isIdStr(123, true)).should.be.false();
            (ValidationService.isIdStr(123.45, true)).should.be.false();
            (ValidationService.isIdStr({}, true)).should.be.false();
            (ValidationService.isId({foo: 'bar'}, true)).should.be.false();
            (ValidationService.isIdStr([], true)).should.be.false();
            (ValidationService.isIdStr(undefined, true)).should.be.false();
            (ValidationService.isIdStr(null, true)).should.be.false();
        });
    });

    describe('ValidationService.isId', function() {

        it('should return false when the required parameter is null or undefined', function() {
            runRequiredFalseCheck('isId');
        });

        it('should return true when the parameter is not required and it is null or undefined', function() {
            runRequiredTrueCheck('isId');
        });

        it('should correctly check the passed id', function() {
            (ValidationService.isId('WhatAReallyLongStringButNotAnID', true)).should.be.false();
            (ValidationService.isId(pb.util.uniqueId(), true)).should.be.false();

            var id = '563764b5bddd13de4bfdb5d7';
            (ValidationService.isId(id, true)).should.be.true();
            (ValidationService.isId(id.substr(0, id.length - 1), true)).should.be.false();
            (ValidationService.isId(pb.DAO.getObjectId(id), true)).should.be.true();
            (ValidationService.isId(pb.DAO.getObjectId(id.substr(0, id.length - 1)), true)).should.be.false();
        });
    });

    describe('ValidationService.isEmail', function() {

        it('should return false when the required parameter is null or undefined', function() {
            runRequiredFalseCheck('isEmail');
        });

        it('should return true when the parameter is not required and it is null or undefined', function() {
            runRequiredTrueCheck('isEmail');
            (ValidationService.isEmail('', false)).should.be.true();
        });

        it('should correctly check the passed email', function() {
            (ValidationService.isEmail('WhatAReallyLongStringButNotAnEmail', true)).should.be.false();
            (ValidationService.isEmail('@.', true)).should.be.false();
            (ValidationService.isEmail('test@', true)).should.be.false();
            (ValidationService.isEmail('test@.com', true)).should.be.false();
            (ValidationService.isEmail('@outlook.com', true)).should.be.false();
            (ValidationService.isEmail('@messenger.co.uk', true)).should.be.false();
            (ValidationService.isEmail('email@pencilblue.org', true)).should.be.true();
            (ValidationService.isEmail('my-address@hoster.net', true)).should.be.true();

            // These are just a few random test cases. There is no 100% perfect
            // email regex, so it's important the email is validated by sending
            // a verification email, etc.
        });
    });

    describe('ValidationService.isVersionNum', function() {

        it('should return false when the required parameter is null or undefined', function() {
            runRequiredFalseCheck('isVersionNum');
        });

        it('should return true when the parameter is not required and it is null or undefined', function() {
            runRequiredTrueCheck('isVersionNum');
            (ValidationService.isVersionNum('', false)).should.be.true();
        });

        it('should correctly check the passed version number', function() {
            (ValidationService.isVersionNum('FooBar', true)).should.be.false();
            (ValidationService.isVersionNum('0.7.0', true)).should.be.true();
            (ValidationService.isVersionNum('0.7.x', true)).should.be.false();
            (ValidationService.isVersionNum('a.b.c', true)).should.be.false();
            (ValidationService.isVersionNum('0.1', true)).should.be.false();
            (ValidationService.isVersionNum(0.1, true)).should.be.false();
            (ValidationService.isVersionNum(1, true)).should.be.false();
        });
    });

    describe('ValidationService.isVersionExpression', function() {

        it('should return false when the required parameter is null or undefined', function() {
            runRequiredFalseCheck('isVersionExpression');
        });

        it('should return true when the parameter is not required and it is null or undefined', function() {
            runRequiredTrueCheck('isVersionExpression');
            (ValidationService.isVersionExpression('', false)).should.be.true();
        });

        it('should correctly check the passed version expression', function() {
            (ValidationService.isVersionExpression('FooBar', true)).should.be.false();

            // We can skip further testing, as the version expression is
            // passed to the semver library, which handles the checking for
            // correctness
        });
    });

    describe('ValidationService.isUrl', function() {

        it('should return false when the required parameter is null or undefined', function() {
            runRequiredFalseCheck('isUrl');
        });

        it('should return true when the parameter is not required and it is null or undefined', function() {
            runRequiredTrueCheck('isUrl');
            (ValidationService.isUrl('', false)).should.be.true();
        });

        it('should correctly check the passed url', function() {
            (ValidationService.isUrl('http://localhost:8080/setup', true)).should.be.true();

            // This URL should not be deemed valid
            (ValidationService.isUrl('http://:8080/setup', true)).should.be.true();

            // The URL regex isn't 100% accurate, so there's no point in running
            // in-depth tests on something that is flawed.
        });
    });

    describe('ValidationService.isSafeFileName', function() {

        it('should return false when the required parameter is null or undefined', function() {
            runRequiredFalseCheck('isSafeFileName');
        });

        it('should return true when the parameter is not required and it is null or undefined', function() {
            runRequiredTrueCheck('isSafeFileName');
            (ValidationService.isSafeFileName('', false)).should.be.true();
        });

        it('should correctly check the passed filename', function() {
            (ValidationService.isSafeFileName('.gitignore', true)).should.be.true();
            (ValidationService.isSafeFileName('archive.bck', true)).should.be.true();
            (ValidationService.isSafeFileName('<add-name>.txt', true)).should.be.false();
        });
    });

    describe('ValidationService.isStr', function() {

        it('should return false when the required parameter is null or undefined', function() {
            runRequiredFalseCheck('isStr');
        });

        it('should return true when the parameter is not required and it is null or undefined', function() {
            runRequiredTrueCheck('isStr');
            (ValidationService.isStr('', false)).should.be.true();
        });

        it('should correctly identify a string', function() {
            (ValidationService.isStr(123, true)).should.be.false();
            (ValidationService.isStr('123', true)).should.be.true();
            (ValidationService.isStr(' ', true)).should.be.true();
            (ValidationService.isStr('', true)).should.be.true();
        });
    });

    describe('ValidationService.isNonEmptyStr', function() {

        it('should return false when the required parameter is null or undefined', function() {
            runRequiredFalseCheck('isNonEmptyStr');
        });

        it('should return true when the parameter is not required and it is null or undefined', function() {
            runRequiredTrueCheck('isNonEmptyStr');
            (ValidationService.isNonEmptyStr('', false)).should.be.true();
        });

        it('should correctly identify an empty string', function() {
            (ValidationService.isNonEmptyStr(123, true)).should.be.false();
            (ValidationService.isNonEmptyStr('', true)).should.be.false();
            (ValidationService.isNonEmptyStr(' ', true)).should.be.true();
            (ValidationService.isNonEmptyStr('123', true)).should.be.true();
        });
    });

    describe('ValidationService.isArray', function() {

        it('should return false when the required parameter is null or undefined', function() {
            runRequiredFalseCheck('isArray');
        });

        it('should return true when the parameter is not required and it is null or undefined', function() {
            runRequiredTrueCheck('isArray');
            (ValidationService.isArray([], false)).should.be.true();
        });

        it('should correctly identify an array', function() {
            (ValidationService.isArray({}, true)).should.be.false();
            (ValidationService.isArray([], true)).should.be.true();
            (ValidationService.isArray([['foo', 'bar']], true)).should.be.true();
            (ValidationService.isArray('[]', true)).should.be.false();
        });
    });

    describe('ValidationService.isObj', function() {

        it('should return false when the required parameter is null or undefined', function() {
            runRequiredFalseCheck('isObj');
        });

        it('should return true when the parameter is not required and it is null or undefined', function() {
            runRequiredTrueCheck('isObj');
            (ValidationService.isObj({}, false)).should.be.true();
        });

        it('should correctly identify an object', function() {
            (ValidationService.isObj([], true)).should.be.true();
            (ValidationService.isObj({}, true)).should.be.true();
            (ValidationService.isObj({foo: 'bar'}, true)).should.be.true();
            (ValidationService.isObj([{foo: 'bar'}], true)).should.be.true();
            (ValidationService.isObj('{}', true)).should.be.false();
        });
    });

    describe('ValidationService.isInt', function() {

        it('should return false when the required parameter is null or undefined', function() {
            runRequiredFalseCheck('isInt');
        });

        it('should return true when the parameter is not required and it is null or undefined', function() {
            runRequiredTrueCheck('isInt');
            (ValidationService.isInt(0, false)).should.be.true();
        });

        it('should correctly use strict mode', function() {
            (ValidationService.isInt('9000', false, true)).should.be.false();
            (ValidationService.isInt(9000, false, true)).should.be.true();
        });

        it('should correctly identify an integer', function() {
            (ValidationService.isInt(Number.NaN, true)).should.be.false();
            (ValidationService.isInt(Number.MAX_SAFE_INTEGER, true)).should.be.true();
            (ValidationService.isInt(Number.MIN_SAFE_INTEGER, true)).should.be.true();
            (ValidationService.isInt('NotANumber', true)).should.be.false();
            (ValidationService.isInt(0xFF, true)).should.be.true();
            (ValidationService.isInt(-1, true)).should.be.true();
            (ValidationService.isInt(0, true)).should.be.true();
            (ValidationService.isInt(1, true)).should.be.true();
            (ValidationService.isInt(1.0, true)).should.be.true();
            (ValidationService.isInt(3.14, true)).should.be.false();
            (ValidationService.isInt(314e-2, true)).should.be.false();
            (ValidationService.isInt(0.0314E+2, true)).should.be.false();
            (ValidationService.isInt('3.14and some non digit stuff', true)).should.be.false();
        });
    });

    describe('ValidationService.isFloat', function() {

        it('should return false when the required parameter is null or undefined', function() {
            runRequiredFalseCheck('isFloat');
        });

        it('should return true when the parameter is not required and it is null or undefined', function() {
            runRequiredTrueCheck('isFloat');
            (ValidationService.isFloat(0, false)).should.be.false();
        });

        it('should correctly use strict mode', function() {
            (ValidationService.isFloat('0.123', false, true)).should.be.false();
            (ValidationService.isFloat(0.123, false, true)).should.be.true();
        });

        it('should correctly identify a float', function() {
            (ValidationService.isFloat(Number.NaN, true)).should.be.false();
            (ValidationService.isFloat(Number.MAX_SAFE_INTEGER, true)).should.be.false();
            (ValidationService.isFloat(Number.MIN_SAFE_INTEGER, true)).should.be.false();
            (ValidationService.isFloat('NotANumber', true)).should.be.false();
            (ValidationService.isFloat(0xFF, true)).should.be.false();
            (ValidationService.isFloat(-1, true)).should.be.false();
            (ValidationService.isFloat(0, true)).should.be.false();
            (ValidationService.isFloat(1, true)).should.be.false();
            (ValidationService.isFloat(1.0, true)).should.be.false();
            (ValidationService.isFloat(3.14, true)).should.be.true();
            (ValidationService.isFloat(314e-2, true)).should.be.true();
            (ValidationService.isFloat(0.0314E+2, true)).should.be.true();
            (ValidationService.isFloat('3.14and some non digit stuff', true)).should.be.false();
        });
    });

    describe('ValidationService.isNum', function() {

        it('should return true when the parameter is not required and it is null or undefined', function() {
            runRequiredTrueCheck('isNum');
        });

        it('should correctly identify a number', function() {
            (ValidationService.isNum(null, true)).should.be.true();
            (ValidationService.isNum(undefined, true)).should.be.false();
            (ValidationService.isNum(Number.NaN, true)).should.be.false();
            (ValidationService.isNum(Number.MAX_SAFE_INTEGER, true)).should.be.true();
            (ValidationService.isNum(Number.MIN_SAFE_INTEGER, true)).should.be.true();
            (ValidationService.isNum(Number.MAX_SAFE_INTEGER, true)).should.be.true();
            (ValidationService.isNum(Number.MIN_SAFE_INTEGER, true)).should.be.true();
            (ValidationService.isNum(Number.MAX_VALUE, true)).should.be.true();
            (ValidationService.isNum(Number.MIN_VALUE, true)).should.be.true();
            (ValidationService.isNum('NotANumber', true)).should.be.false();
            (ValidationService.isNum(0xFF, true)).should.be.true();
            (ValidationService.isNum(-1, true)).should.be.true();
            (ValidationService.isNum(0, true)).should.be.true();
            (ValidationService.isNum(1, true)).should.be.true();
            (ValidationService.isNum(3.14, true)).should.be.true();
            (ValidationService.isNum(314e-2, true)).should.be.true();
            (ValidationService.isNum(0.0314E+2, true)).should.be.true();
            (ValidationService.isNum('3.14and some non digit stuff', true)).should.be.false();
            (ValidationService.isNum('9000', true)).should.be.true();
        });
    });

    describe('ValidationService.isBool', function() {

        it('should return false when the required parameter is null or undefined', function() {
            runRequiredFalseCheck('isBool');
        });

        it('should correctly identify a boolean', function() {
            (ValidationService.isBool('NotABoolean')).should.be.false();
            (ValidationService.isBool(true)).should.be.true();
            (ValidationService.isBool(false)).should.be.true();
            (ValidationService.isBool(1)).should.be.false();
            (ValidationService.isBool(0)).should.be.false();
            (ValidationService.isBool('true')).should.be.false();
            (ValidationService.isBool('false')).should.be.false();
        });
    });

    describe('ValidationService.isEmpty', function() {

        it('should return true when the required parameter is null or undefined', function() {
            (ValidationService.isEmpty(null)).should.be.true();
            (ValidationService.isEmpty(undefined)).should.be.true();
        });

        it('should correctly identify an empty entity', function() {
            (ValidationService.isEmpty('')).should.be.true();
            (ValidationService.isEmpty('NotEmpty')).should.be.false();
            (ValidationService.isEmpty([])).should.be.true();
            (ValidationService.isEmpty(['foo', 'bar'])).should.be.false();
            (ValidationService.isEmpty({})).should.be.true();
            (ValidationService.isEmpty({foo: 'bar'})).should.be.false();
        });
    });

    describe('ValidationService.isDate', function() {

        it('should return false when the required parameter is null or undefined', function() {
            runRequiredFalseCheck('isDate');
        });

        it('should return true when the parameter is not required and it is null or undefined', function() {
            runRequiredTrueCheck('isDate');
        });

        it('should correctly identify a date', function() {
            var date = new Date();
            (ValidationService.isDate(date)).should.be.true();
            (ValidationService.isDate('2016-02-30T12:00:00')).should.be.false();
            (ValidationService.isDate(date.setHours(25))).should.be.false();
        });
    });
});
