//dependencies
var should        = require('should');
var Configuration = require('../../../../include/config.js');
var Lib           = require('../../../../lib');
var util          = require('util');

describe('SiteMapService', function() {

    var pb = null;
    var SiteMapService = null;
    before('Initialize the Environment with the default configuration', function() {

        //travis gets slow so we bump the timeout just a little here to get around the BS
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        SiteMapService = pb.SiteMapService;
    });

    describe('SiteMapService.serializeLocaleLink', function() {

        it('should create a link element', function() {
            var context = {
                locale: 'en-US',
                relationship: 'alternate',
                url: 'http://pencilblue.org/article/how-&-when'
            };
            var result = SiteMapService.serializeLocaleLink(context);
            result.should.eql('<xhtml:link rel="alternate" hreflang="en-US" href="http://pencilblue.org/article/how-&amp;-when" />');
        });
    });

    describe('SiteMapService.createAlternateLinks', function() {

        it('should provide an empty string when item is not localized', function() {

            var item = { localized: false };
            var result = SiteMapService.createAlternateLinks(item, 'en-US', [], 'global.localhost');
            result.should.eql('');
        });

        it('should skip the current locale', function() {

            var item = { localized: true };
            var result = SiteMapService.createAlternateLinks(item, 'en-US', ['en-US'], 'global.localhost');
            result.should.eql('');
        });

        it('should create link elements for each locale', function() {

            var item = { localized: true, url: 'https://pencilblue.org/article/how-&-when' };
            var result = SiteMapService.createAlternateLinks(item, 'ro-RO', ['en-US', 'es-ES'], pb.config.siteRoot);
            result.should.eql('<xhtml:link rel="alternate" hreflang="en-US" href="http://localhost:8080/en-US/article/how-&amp;-when" />\n<xhtml:link rel="alternate" hreflang="es-ES" href="http://localhost:8080/es-ES/article/how-&amp;-when" />\n');
        });
    });

    describe('SiteMapService.formatGetResults', function() {

        it('should return a function', function() {
            var result = SiteMapService.formatGetResults(function(){});
            result.should.be.type('function');
        });

        it('should callback with an error when passed an error', function(done) {
            var error = new Error('hello');
            var func = SiteMapService.formatGetResults(function(err, result) {
                err.should.eql(error);
                done();
            });
            func(error);
        });

        it('should reduce the results down to a single array provided in the callback', function(done) {
            var results = [
                ['a', 'b', 'c'],
                [],
                ['d'],
                ['e', 'f']
            ];
            var func = SiteMapService.formatGetResults(function(err, result) {
                result.should.eql(['a', 'b', 'c', 'd', 'e', 'f']);
                done();
            });
            func(null, results);
        });
    });

    describe('SiteMapService.paddedNumStr', function() {

        it('should prefix a number with a 0 when less than 10', function() {

            var result = SiteMapService.paddedNumStr(9);
            result.should.eql('09');
        });

        it('should provide the same value when it is 10 or greater', function() {

            var result = SiteMapService.paddedNumStr(10);
            result.should.eql('10');
        });
    });

    describe('SiteMapService.getLastModDateStr', function() {

        it('should format the date in the format YYYY-MM-DD', function() {
            var date = new Date(Date.parse('2015-11-28T10:16:42+00:00'));
            var dateStr = SiteMapService.getLastModDateStr(date);
            dateStr.should.eql('2015-11-28');
        });
    });

    describe('SiteMapService.register', function() {

        [null, undefined, 1, 2.4, true, false, '', [], {}, function(){}].forEach(function(val) {

            it('should throw when provided the value '+util.inspect(val)+' as the type parameter', function() {
                SiteMapService.register.bind(null, val, function(){}).should.throwError();
            });
        });

        [null, undefined, 1, 2.4, true, false, '', 'hello', [], {}].forEach(function(val) {

            it('should throw when provided the value '+util.inspect(val)+' as the callback parameter', function() {
                SiteMapService.register.bind(null, 'extra-items', val).should.throwError();
            });
        });

        it('should return true when a valid registration is made', function() {
            var result = SiteMapService.register('extra-items', function(context, cb){cb(null, true);});
            result.should.be.true;
        });
    });

    describe('SiteMapService.unregister', function() {

        [null, undefined, 1, 2.4, true, false, '', [], {}, function(){}].forEach(function(val) {

            it('should throw when provided the value '+util.inspect(val)+' as the type parameter', function() {
                SiteMapService.unregister.bind(null, val).should.throwError();
            });
        });

        it('should return false when attempting to unregister a non-existent type', function() {
            var result = SiteMapService.unregister('some-unknown-type');
            result.should.be.false;
        });

        it('should return true when an existing type is unregistered', function() {
            var registerResult = SiteMapService.register('extra-items-u', function(context, cb){cb(null, true);});
            var unregisterResult = SiteMapService.unregister('extra-items-u');
            registerResult.should.be.true;
            unregisterResult.should.be.true;
        });
    });

    describe('SiteMapService.onPostLoad', function() {

        it('should return a function when called', function() {
            var result = SiteMapService.onPostLoad({}, function(){});
            result.should.be.type('function');
        });

        it('should callback with an error when it is passed', function(done) {
            var error = new Error('hello');
            var func = SiteMapService.onPostLoad({}, function(err, results){
                err.should.eql(error);
                done();
            });
            func(error, null);
        });

        it('should format as a section when the prefix is empty', function(done) {
            var options = {
                urlPrefix: '',
                weight: 0.5,
                hostname: 'global.localhost',
                localized: true
            };
            var results = [
                {
                    url: '/11819d0m1ioq'
                }
            ];
            SiteMapService.onPostLoad(options, function(err, actual) {

                actual.should.be.instanceOf(Array).and.have.lengthOf(1);
                actual[0].should.be.type('object');
                actual[0].weight.should.eql(options.weight);
                actual[0].localized.should.eql(options.localized);
                actual[0].url.should.eql('global.localhost/section/11819d0m1ioq');
                done();
            })(null, results);
        });

        it('should format as normal when the prefix is not empty', function(done) {
            var options = {
                urlPrefix: '/article',
                weight: 0.5,
                hostname: 'global.localhost',
                localized: true
            };
            var results = [
                {
                    url: '/11819d0m1ioq'
                }
            ];
            SiteMapService.onPostLoad(options, function(err, actual) {

                actual.should.be.instanceOf(Array).and.have.lengthOf(1);
                actual[0].should.be.type('object');
                actual[0].weight.should.eql(options.weight);
                actual[0].localized.should.eql(options.localized);
                actual[0].url.should.eql('global.localhost/article/11819d0m1ioq');
                done();
            })(null, results);
        });
    });
});
