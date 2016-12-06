//dependencies
var should        = require('should');
var Configuration = require('../../include/config.js');
var Lib           = require('../../lib');

describe('Email', function() {

    var pb = null;
    var EmailService = null;
    before('Initialize the Environment with the default configuration', function() {
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        EmailService = pb.EmailService;
    });

    describe('EmailService.getDefaultSettings', function() {

        it('should return the correct default settings', function() {
            var settings = EmailService.getDefaultSettings();

            settings.should.be.an.Object();
            settings.should.deepEqual({
                from_name: pb.config.siteName,
                from_address: 'no-reply@sample.com',
                verification_subject: pb.config.siteName+' Account Confirmation',
                verification_content: '',
                template: 'admin/elements/default_verification_email',
                service: 'Gmail',
                host: '',
                secure_connection: 1,
                port: 465,
                username: '',
                password: ''
            });
        });
    });
});
