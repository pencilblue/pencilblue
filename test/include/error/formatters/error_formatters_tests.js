//depedencies
var should        = require('should');
var Configuration = require('../../../../include/config.js');
var Lib           = require('../../../../lib');

describe('ErrorFormatters', function() {
    
    var pb = null;
    var ErrorFormatters = null;
    before('Initialize the Environment with the default configuration', function(next) {
        
        //travis gets slow so we bump the timeout just a little here to get around the BS
        this.timeout(10000);
        var start = (new Date()).getTime();
        
        pb = new Lib(Configuration.getBaseConfig());
        ErrorFormatters = pb.ErrorFormatters;
        
        console.log('Completed in %sms', (new Date()).getTime() - start);
        next();
    });
    
    describe('ErrorFormatters.register', function() {
        
        it('should return false when no mime type is provided', function() {
            var mime = null;
            var result = ErrorFormatters.register(mime, function(){});
            var formatter = ErrorFormatters.get(mime);
            result.should.eql(false);
            should.strictEqual(formatter, undefined);
        });
        
        it('should return false when no formatter is provided', function() {
            var mime = 'application/junk';
            var result = ErrorFormatters.register(mime, null);
            var formatter = ErrorFormatters.get(mime);
            result.should.eql(false);
            should.strictEqual(formatter, undefined);
        });
        
        it('should return true when a mime and formatter is provided', function() {
            var mime = 'application/junk';
            var formatter = function(){}
            var result = ErrorFormatters.register(mime, function(){});
            var formatterResult = ErrorFormatters.get(mime);
            result.should.be.ok;
            formatterResult.should.eql(formatter);
        });
    });
    
    describe('ErrorFormatters.unregister', function() {
        
        it('should return false when no mime type is provided', function() {
            var result = ErrorFormatters.unregister(null);
            result.should.eql(false);
        });
        
        it('should return true when a custom formatter was registered', function() {
            var mime = 'application/unregister-test';
            var registerResult = ErrorFormatters.register(mime, function(){});
            var unregisterResult = ErrorFormatters.unregister(mime);
            registerResult.should.eql(true);
            unregisterResult.should.eql(true);
        });
        
        it('should set the default when the default is unregistered', function() {
            var mime = 'application/json';
            var registerResult = ErrorFormatters.register(mime, function(){});
            var unregisterResult = ErrorFormatters.unregister(mime);
            var formatter = ErrorFormatters.get(mime);
            registerResult.should.eql(true);
            unregisterResult.should.eql(true);
            formatter.should.eql(ErrorFormatters.json);
        });
    });
    
    describe('ErrorFormatters.html', function() {
        
        it('should call the request handler to execute a controller', function() {
            var resultContext = null;
            var error = new Error('hello world');
            error.code = 510;
            
            var params = {
                error: error,
                activeTheme: 'pencilblue',
                reqHandler: {
                    doRender: function(context) {
                        resultContext = context; 
                    }
                }
            };
            ErrorFormatters.html(params, function(err, result){});
            resultContext.initParams.error.should.eql(error);
            resultContext.cInstance.should.not.be.null;
        });
    });
    
    describe('ErrorFormatters.xml', function() {
        
        it('should return a string that represents XML', function(next) {
            var error = new Error('hello world validation error');
            error.code = 400;
            error.validationErrors = [
                {
                    field: '<name>',
                    message: 'it is required',
                    code: 'V1001'
                },
                {
                    field: 'id',
                    message: 'it should be there & be square',
                    code: 'V1002'
                },
            ];
            var params = {
                error: error
            };
            ErrorFormatters.xml(params, function(err, result){
                
                result.should.be.type('string');
                next(err);
            });
        });
    });
    
    describe('ErrorFormatters.json', function() {
        
        it('should return a string that represents JSON', function(next) {
            var error = new Error('hello world');
            error.code = 503;
            var params = {
                error: error
            };
            ErrorFormatters.json(params, function(err, result){
                var obj = JSON.parse(result);
                
                result.should.be.type('string');
                obj.code.should.eql(error.code);
                obj.message.should.eql(error.message);
                next(err);
            });
        });
    });
    
    describe('ErrorFormatters.formatForMime', function() {
        
        it('should return a string that represents JSON when given default formatter for JSON', function(next) {
            var mime = 'application/json';
            var error = new Error('hello world');
            error.code = 503;
            var params = {
                mime: mime,
                error: error
            };
            ErrorFormatters.formatForMime(params, function(err, result){
                var obj = JSON.parse(result.content);
                
                result.should.be.type('object');
                result.mime.should.eql(mime);
                obj.code.should.eql(error.code);
                obj.message.should.eql(error.message);
                next(err);
            });
        });
        
        it('should return a string that represents HTML when provided an unknown formatter', function() {
            var resultContext = null;
            var error = new Error('hello world');
            error.code = 503;
            var params = {
                mime: 'application/non-existing',
                error: error,
                activeTheme: 'pencilblue',
                reqHandler: {
                    doRender: function(context) {
                        resultContext = context; 
                    }
                }
            };
            ErrorFormatters.formatForMime(params, function(err, result){});
            resultContext.initParams.error.should.eql(error);
            resultContext.cInstance.should.not.be.null;
                
            var formatter = ErrorFormatters.get(params.mime);
            should.strictEqual(formatter, undefined);
        });
        
        it('should throw when an error is not provided', function(next) {
            var params = {
                mime: 'application/non-existing'
            };
            ErrorFormatters.formatForMime(params, function(err, result) {
                err.should.not.eql(undefined);
                err.should.not.eql(null);
                should.strictEqual(result, undefined);
                next();
            });
        });
        
        it('should throw when a mime type is not provided', function(next) {
            var params = {
                error: new Error('hello world')
            };
            ErrorFormatters.formatForMime(params, function(err, result) {
                err.should.not.eql(undefined);
                err.should.not.eql(null);
                should.strictEqual(result, undefined);
                next();
            });
        });
    });
});