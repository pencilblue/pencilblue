
//dependencies
var should        = require('should');
var Configuration = require('../../include/config.js');
var Lib           = require('../../lib');

describe('SecurityService', function() {

    var pb = null;
    var SecurityService = null;
    var sessions = null;
    before('Initialize the Environment with the default configuration', function(next) {

        //travis gets slow so we bump the timeout just a little here to get around the BS
        this.timeout(10000);
        var start = (new Date()).getTime();

        pb = new Lib(Configuration.getBaseConfig());
        SecurityService = pb.SecurityService;

        sessions = {
            ADMIN: {
                authentication: {
                    user: {
                        id: '12345',
                        name: 'Admin',
                        admin_level: 4
                    },
                    user_id: pb.util.uniqueId(),
                    admin_level: 4
                }
            },
            USER: {
                authentication: {
                    user: 'USER',
                    user_id: pb.util.uniqueId(),
                    admin_level: 0
                }
            },
            GUEST: {
                authentication: {
                    user: null,
                    user_id: null,
                    admin_level: 0
                }
            }
        };

        console.log('Completed in %sms', (new Date()).getTime() - start);
        next();
    });

    describe('SecurityService.getRoleToDisplayNameMap', function() {

        it('should provide the 5 basic roles', function() {

            var ls     = new pb.Localization('en-US');
            var result = SecurityService.getRoleToDisplayNameMap(ls);

            result.ACCESS_ADMINISTRATOR.should.eql('generic.ACCESS_ADMINISTRATOR');
            result.ACCESS_MANAGING_EDITOR.should.eql('generic.ACCESS_MANAGING_EDITOR');
            result.ACCESS_EDITOR.should.eql('generic.ACCESS_EDITOR');
            result.ACCESS_WRITER.should.eql('generic.ACCESS_WRITER');
            result.ACCESS_USER.should.eql('generic.ACCESS_USER');
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
            should(result.length === 5).be.ok();
            should(result.indexOf('generic.ACCESS_ADMINISTRATOR') >= 0).be.ok();
            should(result.indexOf('generic.ACCESS_MANAGING_EDITOR') >= 0).be.ok();
            should(result.indexOf('generic.ACCESS_EDITOR') >= 0).be.ok();
            should(result.indexOf('generic.ACCESS_WRITER') >= 0).be.ok();
            should(result.indexOf('generic.ACCESS_USER') >= 0).be.ok();
        });

        it('should throw when no localization instance is provided', function() {
            SecurityService.getRoleNames.bind(null).should.throwError();
        });
    });

    describe('SecurityService.getRoleName', function() {
        it('should return the correct role name for provided access level', function() {
            SecurityService.getRoleName(0).should.equal('ACCESS_USER');
            SecurityService.getRoleName(1).should.equal('ACCESS_WRITER');
            SecurityService.getRoleName(2).should.equal('ACCESS_EDITOR');
            SecurityService.getRoleName(3).should.equal('ACCESS_MANAGING_EDITOR');
            SecurityService.getRoleName(4).should.equal('ACCESS_ADMINISTRATOR');
        });

        it('should throw when no access level is provided', function() {
            SecurityService.getRoleName.bind(null).should.throwError();
            SecurityService.getRoleName.bind(undefined).should.throwError();
            SecurityService.getRoleName.bind(-1).should.throwError();
        });
    });

    describe('SecurityService.isAuthorized', function() {
        it('should correctly check for required authentication', function() {
            var requirements = {};  

            requirements[SecurityService.AUTHENTICATED] = false;
            SecurityService.isAuthorized(sessions.ADMIN, requirements).should.be.true();
            SecurityService.isAuthorized(sessions.USER, requirements).should.be.true();
            SecurityService.isAuthorized(sessions.GUEST, requirements).should.be.true();

            requirements[SecurityService.AUTHENTICATED] = true;
            SecurityService.isAuthorized(sessions.ADMIN, requirements).should.be.true();
            SecurityService.isAuthorized(sessions.USER, requirements).should.be.true();
            SecurityService.isAuthorized(sessions.GUEST, requirements).should.be.false();

            requirements[SecurityService.ADMIN_LEVEL] = SecurityService.ACCESS_ADMINISTRATOR;
            SecurityService.isAuthorized(sessions.ADMIN, requirements).should.be.true();
            SecurityService.isAuthorized(sessions.USER, requirements).should.be.false();
            SecurityService.isAuthorized(sessions.GUEST, requirements).should.be.false();

            requirements[SecurityService.ADMIN_LEVEL] = SecurityService.ACCESS_USER;
            SecurityService.isAuthorized(sessions.ADMIN, requirements).should.be.true();
            SecurityService.isAuthorized(sessions.USER, requirements).should.be.true();
            SecurityService.isAuthorized(sessions.GUEST, requirements).should.be.false();
        });
    });

    describe('SecurityService.isAuthenticated', function() {
        it('should check whether a session is authentic', function() {
            SecurityService.isAuthenticated(sessions.ADMIN).should.be.true();
            SecurityService.isAuthenticated(sessions.USER).should.be.true();
            SecurityService.isAuthenticated(sessions.GUEST).should.be.false();
            SecurityService.isAuthenticated(pb.util.uniqueId()).should.be.false();
        });
    });

    describe('SecurityService.encrypt', function() {
        it('should encrypt a password', function() {
            var encrypted = SecurityService.encrypt('abcd');
            encrypted.should.not.equal('abcd');
            SecurityService.encrypt('abcd').should.equal(encrypted);
            SecurityService.encrypt('dcba').should.not.equal(encrypted);
        });
    });

    describe('SecurityService.generatePassword', function() {
        it('should generate a password with a minimum length of 8', function() {
            SecurityService.generatePassword(null).should.have.length(8);
            SecurityService.generatePassword(undefined).should.have.length(8);
            SecurityService.generatePassword(0).should.have.length(8);
            SecurityService.generatePassword(7).should.have.length(8);
            SecurityService.generatePassword(20).should.have.length(20);
        });    

        it('should generate 25 different passwords that are all unique', function() {
            var passwords = [];
            for (var i = 0; i < 25; i++) {
                passwords.push(SecurityService.generatePassword(8));
                for (var j = 0; j < passwords.length; j++) {
                    if (i !== j) {
                        passwords[i].should.not.equal(passwords[j]);
                    };
                }
            }
        });
    });
    
    describe('SecurityService.getPrincipal', function() {
        it('should return the user principal', function() {
            SecurityService.getPrincipal(sessions.ADMIN).should.deepEqual({
                id: '12345',
                name: 'Admin',
                admin_level: 4
            });
            SecurityService.getPrincipal(sessions.USER).should.equal('USER');
            (SecurityService.getPrincipal(sessions.GUEST) === null).should.be.true();
            (SecurityService.getPrincipal(pb.util.uniqueId()) === null).should.be.true();
        });
    });
});
