
//depedencies
var should        = require('should');
var Configuration = require('../../include/config.js');

describe('Configuration', function() {
    
    describe('Configuration.getBaseConfig', function() {
        
        it('should provide a valid base configuration', function() {
            
            var config = Configuration.getBaseConfig();
            config.should.be.type('object');
        });
    });
    
    describe('Configuration.mergeWithBase', function() {
        
        it('should apply the new db name to the config', function() {
            
            var dbName = "apples2apples";
            var overrides = {
                db: {
                    name: dbName
                }
            };
            var config = Configuration.mergeWithBase(overrides);
            config.should.be.type('object');
            config.db.name.should.eql(dbName);
        });
        
        it('should ensure any ending "/" is removed from the siteRoot', function() {
            
            var overrides = {
                siteRoot: "http://apples.2.apples.com/"
            };
            var config = Configuration.mergeWithBase(overrides);
            config.should.be.type('object');
            config.siteRoot.should.eql('http://apples.2.apples.com');
        });
    });
});
