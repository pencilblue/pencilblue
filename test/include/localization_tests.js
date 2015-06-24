
//depedencies
var should        = require('should');
var Configuration = require('../../include/config.js');
var Lib           = require('../../lib');

describe('Localization', function() {
    
    //set the dummy data for 
    var dummyLocale = 'pl-pl';
    var dummyLocalizations = { key: 'value' };
    
    var pb = null;
    var Localization = null;
    before('Initialize the Environment with the default configuration', function(next) {
        
        //travis gets slow so we bump the timeout just a little here to get around the BS
        this.timeout(10000);
        
        pb = new Lib(Configuration.getBaseConfig());
        Localization = pb.Localization;
        next();
    });
    
    describe('Localization.getLocalizationPackage', function() {
        
        var acceptable = ['pl-PL', 'pl-pl'];
        acceptable.forEach(function(locale) {
            
            it('should return a valid package when provided '+locale, function() {
                Localization.storage[dummyLocale] = dummyLocalizations;
                
                var package = Localization.getLocalizationPackage(locale);
                package.should.eql(dummyLocalizations);
            });
        });
        
        var unacceptable = [null, undefined, 'en-US', 'en-us'];
        unacceptable.forEach(function(locale) {
            
            it('should return null when provided '+locale, function() {
                Localization.storage[dummyLocale] = dummyLocalizations;
                
                var package = Localization.getLocalizationPackage(locale);
                should(package === null).be.ok;
            });
        });
    });
    
    describe('Localization.isSupported', function() {
        
        var acceptable = ['pl-PL', 'pl-pl'];
        acceptable.forEach(function(locale) {
            
            it('should return true when provided '+locale, function() {
                Localization.storage[dummyLocale] = dummyLocalizations;
                
                var supported = Localization.isSupported(locale);
                supported.should.be.ok;
            });
        });
        
        var unacceptable = [null, undefined, 'en-US', 'en-us'];
        unacceptable.forEach(function(locale) {
            
            it('should return false when provided '+locale, function() {
                Localization.storage[dummyLocale] = dummyLocalizations;
                
                var supported = Localization.isSupported(locale);
                supported.should.not.be.ok;
            });
        });
    });
});
        