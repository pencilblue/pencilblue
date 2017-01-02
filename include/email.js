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

// dependencies
const NodeMailer = require('nodemailer');
const util = require('./util.js');

module.exports = function EmailServiceModule(pb) {
  /**
   *
   * @private
   * @static
   * @readonly
   * @property DEFAULT_SETTINGS
   * @type {Object}
   */
  const DEFAULT_SETTINGS = Object.freeze({
    from_name: pb.config.siteName,
    from_address: 'no-reply@sample.com',
    verification_subject: `${pb.config.siteName} Account Confirmation`,
    verification_content: '',
    template: 'admin/elements/default_verification_email',
    service: 'Gmail',
    host: '',
    secure_connection: 1,
    port: 465,
    username: '',
    password: '',
  });

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
        this.site = pb.SiteService.getCurrentSite(options.site);
        this.onlyThisSite = options.onlyThisSite || false;
      }
    }
    /**
     * Retrieves a template and sends it as an email
     *
     * @method sendFromTemplate
     * @param {Object}   options Object containing the email settings and template name
     * @param {Function} cb      Callback function
     */
    sendFromTemplate(options, cb) {
      const self = this;

      // TODO: Move the instantiation of the template service to the constructor
      // so it can be injectable with all of the other context properties it needs.
      const ts = new pb.TemplateService({ site: this.site });
      if (options.replacements) {
        Object.keys(options.replacements).forEach((key) => {
          ts.registerLocal(key, options.replacements[key]);
        });
      }
      ts.load(options.template, (err, data) => {
        const body = String(data);
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
      const self = this;
      const layout = options.layout;
      if (options.replacements) {
        Object.keys(options.replacements).forEach((key) => {
          layout.split(`^${key}^`).join(options.replacements[key]);
        });
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
      this.getSettings((err, emailSettings) => {
        if (util.isError(err)) {
          throw err;
        } else if (!emailSettings) {
          const settingErr = new Error('No Email settings available.  Go to the admin settings and put in SMTP settings');
          pb.log.error(settingErr.stack);
          return cb(settingErr);
        }

        const options = {
          service: emailSettings.service,
          auth:
          {
            user: emailSettings.username,
            pass: emailSettings.password,
          },
        };
        if (emailSettings.service === 'custom') {
          options.host = emailSettings.host;
          options.secureConnection = emailSettings.secure_connection;
          options.port = emailSettings.port;
        }
        const smtpTransport = NodeMailer.createTransport('SMTP', options);

        const mailOptions = {
          from: from || (`${emailSettings.from_name}<${emailSettings.from_address}>`),
          to,
          subject,
          html: body,
        };

        return smtpTransport.sendMail(mailOptions, (sendErr, response) => {
          if (util.isError(sendErr)) {
            pb.log.error('EmailService: Failed to send email: ', sendErr.stack);
          }
          smtpTransport.close();

          cb(sendErr, response);
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
      const self = this;
      const settingsService = pb.SettingServiceFactory.getServiceBySite(
        self.site,
        self.onlyThisSite);
      settingsService.get('email_settings', (err, settings) => {
        cb(err, util.isError(err) || !settings ? EmailService.getDefaultSettings() : settings);
      });
    }

    /**
     * Retrieves the default email settings from installation
     *
     * @method getDefaultSettings
     * @return {Object} Email settings
     */
    static getDefaultSettings() {
      return DEFAULT_SETTINGS;
    }
  }
  // exports
  return EmailService;
};
