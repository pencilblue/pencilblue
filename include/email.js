/*
    Copyright (C) 2016  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
'use strict';

//dependencies
var _ = require('lodash');
var Configuration = require('./config');
var log = require('./utils/logging').newInstance('EmailService');
var NodeMailer = require('nodemailer');
var SettingServiceFactory = require('./system/settings');
var SiteService = require('./service/entities/site_service');
var TemplateService = require('./service/entities/template_service');

/**
 * Service for sending emails.
 *
 * @module Services
 * @class EmailService
 * @constructor
 * @param {String} [options.site=GLOBAL_SITE]
 * @param {String} [options.onlyThisSite=false]
 */
class EmailService {
    constructor(options) {
        if (options) {
            this.site = SiteService.getCurrentSite(options.site);
            this.onlyThisSite = options.onlyThisSite || false;
        }
    }

    /**
     *
     * @private
     * @static
     * @readonly
     * @property DEFAULT_SETTINGS
     * @type {Object}
     */
    static get DEFAULT_SETTINGS() {
        return Object.freeze({
            from_name: Configuration.active.siteName,
            from_address: 'no-reply@sample.com',
            verification_subject: Configuration.active.siteName + ' Account Confirmation',
            verification_content: '',
            template: 'admin/elements/default_verification_email',
            service: 'Gmail',
            host: '',
            secure_connection: 1,
            port: 465,
            username: '',
            password: ''
        });
    }

    /**
     * Retrieves a template and sends it as an email
     *
     * @method sendFromTemplate
     * @param {Object}   options Object containing the email settings and template name
     * @param {Function} cb      Callback function
     */
    sendFromTemplate(options, cb) {
        var self = this;

        //TODO: Move the instantiation of the template service to the constructor so it can be injectable with all of the other context properties it needs.
        var ts = new TemplateService({site: this.site});
        if (options.replacements) {
            for (var key in options.replacements) {
                ts.registerLocal(key, options.replacements[key]);
            }
        }
        ts.load(options.template, function (err, data) {

            var body = '' + data;
            self.send(options.from, options.to, options.subject, body, cb);
        });
    }

    /**
     * Uses an HTML layout and sends it as an email
     *
     * @method sendFromLayout
     * @param {Object}   options Object containing the email settings and layout
     * @param {Function} cb      Callback function
     */
    sendFromLayout(options, cb) {
        var self = this;
        var layout = options.layout;
        if (options.replacements) {
            for (var key in options.replacements) {
                layout.split('^' + key + '^').join(options.replacements[key]);
            }
        }
        self.send(options.from, options.to, options.subject, layout, cb);
    }

    /**
     * Sends an email
     *
     * @method send
     * @param  {String}   from    From name
     * @param  {String}   to      To email address
     * @param  {String}   subject Email subject
     * @param  {String}   body    Email content
     * @param  {Function} cb      Callback function
     */
    send(from, to, subject, body, cb) {

        this.getSettings(function (err, emailSettings) {
            if (_.isError(err)) {
                throw err;
            }
            else if (!emailSettings) {
                err = new Error('No Email settings available.  Go to the admin settings and put in SMTP settings');
                log.error(err.stack);
                return cb(err);
            }

            var options = {
                service: emailSettings.service,
                auth: {
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

            var mailOptions = {
                from: from || (emailSettings.from_name + '<' + emailSettings.from_address + '>'),
                to: to,
                subject: subject,
                html: body
            };

            smtpTransport.sendMail(mailOptions, function (err, response) {
                if (_.isError(err)) {
                    log.error("EmailService: Failed to send email: ", err.stack);
                }
                smtpTransport.close();

                cb(err, response);
            });
        });
    }

    /**
     * Retrieves the email settings
     *
     * @method getSettings
     * @param {Function} cb Callback function
     */
    getSettings(cb) {
        var self = this;
        var settingsService = SettingServiceFactory.getServiceBySite(self.site, self.onlyThisSite);
        settingsService.get('email_settings', function (err, settings) {
            cb(err, _.isError(err) || !settings ? EmailService.DEFAULT_SETTINGS : settings);
        });
    }
}

//exports
module.exports = EmailService;
