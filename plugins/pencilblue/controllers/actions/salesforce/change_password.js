'use strict';

const passport = require('koa-passport');
const request = require('request');

module.exports = function SalesforceChangePasswordControllerModule(pb) {

    //dependencies
    /**
     * Authenticates a user via Salesforce
     * @class LoginSFActionControllerModule
     * @constructor
     * @extends FormController
     */
    class SalesforceChangePasswordController extends pb.BaseController {
        render(cb) {
            this.sanitizeObject(this.body);
            this.changePassword(cb);
        }

        async changePassword(cb) {
            const user = this.ctx.session.authentication.user;
            return cb({
                code: 200,
                content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'testing', {
                    yey: true,
                    body: this.body,
                    user
                })
            });
        }
    }

    return SalesforceChangePasswordController;
};