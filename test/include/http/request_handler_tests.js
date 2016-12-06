
//dependencies
var should      = require('should');
var TestHelpers = require('../../test_helpers');

describe('RequestHandler', function() {

    TestHelpers.registerReset();

    describe('RequestHandler.getBodyParsers', function() {

        it('should return the default list of body parsers', function() {
           var result = this.pb.RequestHandler.getBodyParsers();
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
                var result = this.pb.RequestHandler.registerBodyParser(mime, function(){});
                result.should.be.false();
            });
        });

        [null, undefined, '', false, true, 1, 10.0, {}].forEach(function(parser){

            it('should return false when an invalid parser '+parser+' is provided', function(){
                var result = this.pb.RequestHandler.registerBodyParser('application/xml', parser);
                result.should.be.false();
            });
        });

        it('should replace the default parser when supplied with a mime that is already registered', function(){

            var parsers = this.pb.RequestHandler.getBodyParsers();
            var originalJsonParser = parsers['application/json'];
            originalJsonParser.should.be.type('function');

            var newParser = function(){};
            var result = this.pb.RequestHandler.registerBodyParser('application/json', newParser);
            result.should.be.true();

            parsers = this.pb.RequestHandler.getBodyParsers();
            parsers['application/json'].should.not.eql(originalJsonParser);
            parsers['application/json'].should.eql(newParser);
        });
    });

    describe('RequestHandler.emitThemeRouteRetieved', function() {

        it('should emit the theme route retrieved to the listener and provide the proper context', function(done) {

            var themeRoute = {a: '1', b: 2};
            var site = 'abc123';
            var reqHandler = new this.pb.RequestHandler(null, {url: '/hello/world', headers: {}});
            reqHandler.routeTheme = themeRoute;
            reqHandler.site = site;
            var cnt = 0;
            this.pb.RequestHandler.on(this.pb.RequestHandler.THEME_ROUTE_RETIEVED, function(ctx, cb) {
                cnt++;
                ctx.themeRoute.should.eql(themeRoute);
                ctx.requestHandler.should.eql(reqHandler);
                ctx.site.should.eql(site);
                cb();
            });
            reqHandler.emitThemeRouteRetrieved(function(err) {
                (err === null).should.eql(true);
                cnt.should.eql(1);
                done();
            });
        });
    });

    describe('buildControllerContext', function() {

        it('should build out the controller context and merge in any extra properties', function() {
            var expected = {

            };
        });
    });
});
