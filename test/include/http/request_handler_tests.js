
//dependencies
var should        = require('should');
var Configuration = require('../../../include/config.js');
var Lib           = require('../../../lib');

describe('RequestHandler', function(){
    
    var pb = null;
    var RequestHandler = null;
    before('Initialize the Environment with the default configuration', function() {

        //travis gets slow so we bump the timeout just a little here to get around the BS
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        RequestHandler = pb.RequestHandler;
    });
    
    describe('RequestHandler.getBodyParsers', function() {
        
        it('should return the default list of body parsers', function() {
           var result = RequestHandler.getBodyParsers();
            result.should.be.type('object');
            result['application/json'].should.be.type('function');
            result['application/x-www-form-urlencoded'].should.be.type('function');
            result['multipart/form-data'].should.be.type('function');
            Object.keys(result).length.should.be.exactly(3);
        });
    });
    
    describe('RequestHandler.registerBodyParser', function(){
        
        [null, undefined, ''].forEach(function(mime){
            
            it('should return false when an invalid mime '+mime+' is provided', function(){
                var result = RequestHandler.registerBodyParser(mime, function(){});
                result.should.be.false;
            });
        });
        
        [null, undefined, '', false, true, 1, 10.0, {}].forEach(function(parser){
            
            it('should return false when an invalid parser '+parser+' is provided', function(){
                var result = RequestHandler.registerBodyParser('application/xml', parser);
                result.should.be.false;
            });
        });
        
        it('should replace the default parser when supplied with a mime that is already registered', function(){
            
            var parsers = RequestHandler.getBodyParsers();
            var originalJsonParser = parsers['application/json'];
            originalJsonParser.should.be.type('function');
            
            var newParser = function(){};
            var result = RequestHandler.registerBodyParser('application/json', newParser);
            result.should.be.true;
            
            parsers = RequestHandler.getBodyParsers();
            parsers['application/json'].should.not.eql(originalJsonParser);
            parsers['application/json'].should.eql(newParser);
        });
    });
});