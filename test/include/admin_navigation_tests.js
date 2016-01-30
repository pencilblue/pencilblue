//depedencies
var should        = require('should');
var Configuration = require('../../include/config.js');
var Lib           = require('../../lib');

describe('AdminNavigation', function() {

    var pb = null;
    var AdminNavigation = null;
    var SiteService = null;
    before('Initialize the Environment with the default configuration', function() {
        //travis gets slow so we bump the timeout just a little here to get around the BS
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        AdminNavigation = pb.AdminNavigation;
        SiteService = pb.SiteService;
    });

    describe('AdminNavigation.add', function() {

        it('should add a node when the node does not already exist with no site provided', function() {
            var node = { id: getNextId() };
            var result = AdminNavigation.add(node);
            result.should.be.ok;
            AdminNavigation.additions[SiteService.GLOBAL_SITE][0].should.eql(node);
        });

        it('should return false when the node already exists with no site provided', function() {
            var node = { id: getNextId() };
            AdminNavigation.add(node);
            var result = AdminNavigation.add(node);
            result.should.not.be.ok;
        });

        it('should add a node when the node does not already exist with a non-global site provided', function() {
            var node = { id: getNextId() };
            var nonGlobalSite = getNextId();
            var result = AdminNavigation.add(node, nonGlobalSite);
            result.should.be.ok;
            AdminNavigation.additions[nonGlobalSite][0].should.eql(node);
        });

        it('should return false when the node already exists with a non-global site provided', function() {
            var node = { id: getNextId() };
            var nonGlobalSite = getNextId();
            AdminNavigation.add(node, nonGlobalSite);
            var result = AdminNavigation.add(node, nonGlobalSite);
            result.should.not.be.ok;
        });
    });

    describe('AdminNavigation.addToSite', function() {

        it('should add a node when the node does not already exist with no site provided', function() {
            AdminNavigation.additions = {};
            var node = { id: getNextId() };
            var result = AdminNavigation.addToSite(node);
            result.should.be.ok;
            AdminNavigation.additions[SiteService.GLOBAL_SITE][0].should.eql(node);
        });

        it('should return false when the node already exists with no site provided', function() {
            var node = { id: getNextId() };
            AdminNavigation.addToSite(node);
            var result = AdminNavigation.addToSite(node);
            result.should.not.be.ok;
        });

        it('should add a node when the node does not already exist with a non-global site provided', function() {
            var node = { id: getNextId() };
            var nonGlobalSite = getNextId();
            var result = AdminNavigation.addToSite(node, nonGlobalSite);
            result.should.be.ok;
            AdminNavigation.additions[nonGlobalSite][0].should.eql(node);
        });

        it('should return false when the node already exists with a non-global site provided', function() {
            var node = { id: getNextId() };
            var nonGlobalSite = getNextId();
            AdminNavigation.addToSite(node, nonGlobalSite);
            var result = AdminNavigation.addToSite(node, nonGlobalSite);
            result.should.not.be.ok;
        });
    });
});

var cnt = 0;
function getNextId() {
    return '' + cnt++;
}
