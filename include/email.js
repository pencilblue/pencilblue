/**
 * EmailService - Provides a simple interface for sending emails.
 *
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC 2014 All Rights Reserved
 */
function EmailService(){}

//dependencies
NodeMailer = require('nodemailer');

EmailService.prototype.sendFromTemplate = function(options, cb){
	var self = this;
	var ts   = new pb.TemplateService();

	if (options.replacements) {
		for(key in options.replacements) {
			ts.registerLocal(key, options.replacements[key]);
		}
	}
	ts.load(options.template, function(data) {

		var body = '' + data;
		self.send(options.from, options.to, options.subject, body, cb);
	});
};

EmailService.prototype.send = function(from, to, subject, body, cb) {

	this.getSettings(function(err, emailSettings) {

        var options = {
            service: emailSettings.service,
            auth:
            {
                user: emailSettings.username,
                pass: emailSettings.password
            }
        };
        if (emailSettings.service == 'custom') {
        	options.host = emailSettings.host,
        	options.secureConnection = emailSettings.secure_connection,
        	options.port = emailSettings.port;
        }
        var smtpTransport = NodeMailer.createTransport("SMTP", options);

        var mailOptions =
        {
            from: from || (emailSettings.from_name + '<' + emailSettings.from_address + '>'),
            to: to,
            subject: subject,
            html: body
        };

        smtpTransport.sendMail(mailOptions, function(err, response) {
            if (util.isError(err)) {
            	pb.log.error("EmailService: Failed to send email: ", err);
            }
            smtpTransport.close();

            cb(err, response);
        });
    });
};

EmailService.prototype.getSettings = function(cb) {
	var self = this;
	pb.settings.get('email_settings', function(err, settings) {
        cb(err, util.isError(err) ? self.getDefaultSettings() : settings);
    });
};

EmailService.prototype.getDeafultSettings = function() {
	return {
        from_name: 'pencilblue',
        from_address: 'no-reply@pencilblue.org',
        verification_subject: 'pencilblue Account Confirmation',
        service: 'Gmail',
        host: '',
        secure_connection: 1,
        port: 465,
        username: '',
        password: ''
    };
};

//exports
module.exports.EmailService = EmailService;
