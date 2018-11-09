'use strict';

const passport = require('koa-passport');
const request = require('request');

module.exports = function LoginSFSSOControllerModule(pb) {

    //dependencies
    var FormController = pb.FormController;

    /**
     * Authenticates a user via Salesforce
     * @class LoginSFActionControllerModule
     * @constructor
     * @extends FormController
     */
    class LoginSFSSOController extends pb.BaseController {
        render(cb) {
            this.sanitizeObject(this.body);
            this.salesforceSSO(cb);
        }

        async salesforceSSO(cb) {
            this.ctx.__site = this.site;
            return passport.authenticate('salesforce', (err, options) => {
                request(options).pipe(this.res);
            })(this.ctx);
        }
    }

    return LoginSFSSOController;
};