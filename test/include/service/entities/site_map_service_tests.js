//dependencies
var should        = require('should');
var Configuration = require('../../../../include/config.js');
var Lib           = require('../../../../lib');

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
});
