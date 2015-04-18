//depedencies
var should        = require('should');
var Configuration = require('../../include/config.js');
var Lib           = require('../../lib');

describe('SecurityService', function() {
    
    var pb = null;
    var SecurityService = null;
    before('Initialize the Environment with the default configuration', function(next) {
        
        //travis gets slow so we bump the timeout just a little here to get around the BS
        this.timeout(10000);
        var start = (new Date()).getTime();
        
        pb = new Lib(Configuration.getBaseConfig());
        SecurityService = pb.SecurityService;
        
        console.log('Completed in %sms', (new Date()).getTime() - start);
        next();
    });
    
    describe('SecurityService.getRoleToDisplayNameMap', function() {
        
        it('should provide the 5 basic roles', function() {
            
            var ls     = new pb.Localization('en_US');
            var result = SecurityService.getRoleToDisplayNameMap(ls);
            
            result.ACCESS_ADMINISTRATOR.should.eql('ACCESS_ADMINISTRATOR');
            result.ACCESS_MANAGING_EDITOR.should.eql('ACCESS_MANAGING_EDITOR');
            result.ACCESS_EDITOR.should.eql('ACCESS_EDITOR');
            result.ACCESS_WRITER.should.eql('ACCESS_WRITER');
            result.ACCESS_USER.should.eql('ACCESS_USER');
        });
        
        it('should throw when no localization instance is provided', function() {
            SecurityService.getRoleToDisplayNameMap.bind(null).should.throwError();
        });
    });
    
    describe('SecurityService.getRoleNames', function() {
        
        it('should provide the 5 basic roles', function() {
            
            var ls     = new pb.Localization('en_US');
            var result = SecurityService.getRoleNames(ls);
            
            result.should.be.instanceof(Array);
            should(result.length === 5).be.ok;
            should(result.indexOf('ACCESS_ADMINISTRATOR') >= 0).be.ok;
            should(result.indexOf('ACCESS_MANAGING_EDITOR') >= 0).be.ok;
            should(result.indexOf('ACCESS_EDITOR') >= 0).be.ok;
            should(result.indexOf('ACCESS_WRITER') >= 0).be.ok;
            should(result.indexOf('ACCESS_USER') >= 0).be.ok;
        });
        
        it('should throw when no localization instance is provided', function() {
            SecurityService.getRoleNames.bind(null).should.throwError();
        });
    });
});