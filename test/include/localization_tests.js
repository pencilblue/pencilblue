
//depedencies
var should        = require('should');
var Configuration = require('../../include/config.js');
var Lib           = require('../../lib');

describe('Localization', function() {

    //set the dummy data for
    var dummyLocale = 'pl-pl';
    var dummyDisplay = 'Polski (Polska)';
    var dummyLocalizations = { key: 'value' };

    var pb = null;
    var Localization = null;
    before('Initialize the Environment with the default configuration', function(next) {

        //travis gets slow so we bump the timeout just a little here to get around the BS
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        Localization = pb.Localization;
        Localization.init(next);
    });

    describe('Localization.getLocalizationPackage', function() {

        var acceptable = ['pl-PL', 'pl-pl'];
        acceptable.forEach(function(locale) {

            it('should return a valid package when provided '+locale, function() {

                var package = Localization.getLocalizationPackage(locale);
                package.generic.LOCALE_DISPLAY.should.eql(dummyDisplay);
            });
        });

        var unacceptable = [null, undefined];
        unacceptable.forEach(function(locale) {

            it('should return null when provided '+locale, function() {

                var package = Localization.getLocalizationPackage(locale);
                should(package === null).be.ok;
            });
        });
        
        var unRegistered = ['en-GB', 'ar-SY'];
        unRegistered.forEach(function(locale) {

            it('should default to English whe provided '+locale, function() {

                var package = Localization.getLocalizationPackage(locale);
                package.generic.LOCALE_DISPLAY.should.eql('English (United States)');
            });
        });
    });

    describe('Localization.isSupported', function() {

        var acceptable = ['pl-PL', 'en-us', 'es-es', 'ro-RO', 'fr-fr', 'pt-br'];
        acceptable.forEach(function(locale) {

            it('should return true when provided '+locale, function() {

                var supported = Localization.isSupported(locale);
                supported.should.be.ok;
            });
        });

        var unacceptable = ['en-GB', 'ar-SY', undefined, false, 0, 1, 2.2, null, ''];
        unacceptable.forEach(function(locale) {

            it('should return false when provided '+locale, function() {

                var supported = Localization.isSupported(locale);
                supported.should.not.be.ok;
            });
        });
    });
    
    describe('Localization.g', function() {
        
        var badKeys = [1, 25.5, true, {}, [], null, undefined];
        badKeys.forEach(function(key) {
            it('should throw when a non-string value [' + key + '] is passed as the key', function() {
                
                var loc = new Localization(dummyLocale);
                loc.g.bind(loc, key, {}).should.throwError();
            });
        });
        
        var badOptions = [1, 25.5, true];
        badOptions.forEach(function(options) {
            it('should throw when a non-object value [' + options + '] is passed as the options parameter', function() {
                
                var loc = new Localization(dummyLocale);
                loc.g.bind(loc, 'generic.LOCALE_DISPLAY', options).should.throwError();
            });
        });
        
        var defaultOptions = [null, undefined, {}];
        defaultOptions.forEach(function(options) {
            it('should return a value when passed a defaulting options parameter: ' + options, function() {
                
                var loc = new Localization(dummyLocale);
                loc.g('generic.LOCALE_DISPLAY', options).should.eql(dummyDisplay);
            });
        });
        
        var badParams = [1, 25.5, true];
        badParams.forEach(function(params) {
            it('should throw when a non-object value [' + params + '] is passed as the options parameter', function() {
                
                var opts = {
                    params: params
                };
                var loc = new Localization(dummyLocale);
                loc.g.bind(loc, 'generic.LOCALE_DISPLAY', opts).should.throwError();
            });
        });
        
        it('should replace parameters in the value of the provided key with the supplied parameters', function() {
            
            var plugin = 'test';
            var key = 'generic.about.pencilblue';
            var val = "PencilBlue is an {adjective} {noun}.  It is quite comprehensive and provides a lot of {keyWord}.";
            var opts = {
                params: {
                    adjective: 'amazing',
                    noun: 'CMS',
                    keyWord: 'features'
                },
                plugin: plugin
            };
            
            var registrationResult = Localization.registerLocalization(dummyLocale, 'generic.about.pencilblue', val, opts);
            registrationResult.should.be.ok;
            
            var loc = new Localization(dummyLocale);
            var result = loc.g(key, opts);
            result.should.eql("PencilBlue is an amazing CMS.  It is quite comprehensive and provides a lot of features.");
        });
    });
    
    describe('Localization.replaceParameters', function() {
        
        var badValues = [1, 2.1, true, {}, [], null, undefined];
        badValues.forEach(function(value) {
            it('should throw an error when an invalid value [' + value + '] is provided', function() {
                Localization.replaceParameters.bind(null, value, {}).should.throwError();
            });
        });
        
        var badParams = [1, 2.1, true, "", null, undefined];
        badParams.forEach(function(params) {
            it('should throw an error when an invalid params parameter [' + params + '] is provided', function() {
                Localization.replaceParameters.bind(null, "hello {world}", params).should.throwError();
            });
        });
        
        it('should replace parameters in the value with the supplied parameters', function() {
            var val = "PencilBlue is an {adjective} {noun}.  It is quite comprehensive and provides a lot of {keyWord}.";
            var params = {
                adjective: 'amazing',
                noun: 'CMS',
                keyWord: 'features'
            };
            var result = Localization.replaceParameters(val, params);
            result.should.eql("PencilBlue is an amazing CMS.  It is quite comprehensive and provides a lot of features.");
        });
    });
    
    describe('Localization.formatLocale', function() {
        
        [1, 2.2, false, {}, [], null, undefined].forEach(function(param) {
            it('should throw an error when a non-string language parameter ' + param + ' is provided', function() {
                Localization.formatLocale.bind(null, param).should.throwError();
            });
        });
        
        [1, 2.2, false, {}, []].forEach(function(param) {
            it('should throw an error when a non-string countryCode parameter ' + param + ' is provided', function() {
                Localization.formatLocale.bind(null, 'en', param).should.throwError();
            });
        });
        
        it('should format the locale with no country code when provided just the language', function() {
            
            var language = 'en';
            var result = Localization.formatLocale(language);
            result.should.eql(language);
        });
        
        it('should format the locale with a country code when provided the language & country code', function() {
            
            var language = 'EN';
            var countryCode = 'us';
            var result = Localization.formatLocale(language, countryCode);
            result.should.eql('en-US');
        });
    });
    
    describe('Localization.parseLocaleStr', function() {
        //TODO
    });
    
    describe('Localization.getSupportedWithDisplay', function() {
        //TODO
    });
    
    describe('Localization.getSupported', function() {
        //TODO
    });
    
    describe('Localization.containsParameters', function() {
        //TODO
    });
    
    describe('Localization.unregisterLocale', function() {
        //TODO
    });
    
    describe('Localization.registerLocalization', function() {
        //TODO
    });
    
    describe('Localization.registerLocale', function() {
        //TODO
    });
});
