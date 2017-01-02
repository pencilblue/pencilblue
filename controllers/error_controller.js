/*
    Copyright (C) 2015  PencilBlue, LLC

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
const async = require('async');

module.exports = function ErrorControllerModule(pb) {
  // pb dependencies
  const util = pb.util;
  /**
   * Default Error Controller for HTML
   * @class ErrorViewController
   * @constructor
   * @extends BaseController
   */
  class ErrorViewController extends pb.BaseController {

    constructor() {
      super();
      /**
       *
       * @method getTemplatePath
       * @return {String}
       */
      this.getTemplatePath = () => 'error/default';
    }
    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    init(context, cb) {
      const init = (err, result) => {
        /**
         *
         * @property error
         * @type {Error}
         */
        this.error = context.error || this.error;

        /**
         *
         * @property status
         * @type {Integer}
         */
        this.status = this.error && this.error.code ? this.error.code : 500;

        /**
         *
         * @property contentSettingService
         * @type {ContentService}
         */
        this.contentSettingService = new pb.ContentService(this.getServiceContext());

        /**
         *
         * @property contentSettingService
         * @type {TopMenuService}
         */
        this.topMenuService = new pb.TopMenuService(this.getServiceContext());

        // set the default page name based on the status code if provided
        this.setPageName(`${this.status}`);

        // carry on
        cb(err, result);
      };
      super.init([context, init]);
    }

    /**
     *
     * @method render
     * @param {Function} cb
     */
    render(cb) {
      this.gatherData((err, dta) => {
        let data = Object.assign({}, dta);
        if (util.isError(err)) {
          // to prevent loops we just bury the error
          pb.log.error('ErrorController: %s', err.stack);
          data = {
            navItems: {},
          };
        }

        // build angular controller
        const angularController = pb.ClientJs.getAngularController(
          {
            navigation: data.navItems.navigation,
            contentSettings: data.contentSettings,
            loggedIn: pb.security.isAuthenticated(this.session),
            accountButtons: data.navItems.accountButtons,
          });

        // register the model with the template service
        const errMsg = this.getErrorMessage();
        const errStack = this.error && pb.config.logging.showErrors ? this.error.stack : '';
        const model = {
          navigation: new pb.TemplateValue(data.navItems.navigation, false),
          account_buttons: new pb.TemplateValue(data.navItems.accountButtons, false),
          angular_objects: new pb.TemplateValue(angularController, false),
          status: this.status,
          error_message: errMsg,
          error_stack: errStack,
        };
        this.ts.registerModel(model);

        // load template
        this.ts.load(this.getTemplatePath(), (loadErr, content) => {
          if (util.isError(loadErr)) {
            // to prevent loops we just bury the error
            pb.log.error('ErrorController: %s', loadErr.stack);
          }

          cb({
            content,
            code: this.status,
            content_type: 'text/html',
          });
        });
      });
    }

    /**
     * @method getErrorMessage
     * @return {String}
     */
    getErrorMessage() {
      return this.error ? this.error.message : this.ls.g('error.ERROR');
    }

    /**
     * @method gatherData
     * @param {Function} cb
     */
    gatherData(cb) {
      const tasks = {
        contentSettings: (callback) => {
          this.contentSettingService.getSettings(callback);
        },

        navItems: (callback) => {
          const options = {
            ls: this.ls,
            activeTheme: this.activeTheme,
            session: this.session,
            currUrl: this.req.url,
          };
          this.topMenuService.getNavItems(options, callback);
        },
      };
      async.parallel(tasks, cb);
    }

  }
  // exports
  return ErrorViewController;
};
