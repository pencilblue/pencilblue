'use strict';

const passport = require('koa-passport');
const request = require('request-promise');

module.exports = function SalesforceChangePasswordControllerModule(pb) {

    //dependencies
    /**
     * Changes an user password
     * @class SalesforceChangePasswordController
     * @constructor
     */
    class SalesforceChangePasswordController extends pb.BaseController {
        render(cb) {
            this.sanitizeObject(this.body);
            this.changePassword(cb);
        }

        async changePassword(cb) {
            try {
                const user = this.ctx.session.authentication.user;
                if (user && user.salesforce) {
                    const url = `${user.salesforce.authorize.instance_url}/services/data/v25.0/sobjects/User/${user.salesforce.profile.id}/password`;
                    const response = await request({
                        method: 'POST',
                        uri: url,
                        body: {
                            NewPassword: this.body.newPassword
                        },
                        headers: {
                            Authorization: `Bearer ${user.salesforce.authorize.access_token}`
                        },
                        json: true
                    });
                }
                return cb({
                    content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, undefined, null)
                });
            } catch (e) {
                let msg = Array.isArray(e.error) && e.error.length > 0 ? e.error[0].message : 'Something went wrong during the api call';
                pb.log.error('Something went wrong during the change salesforce password call: ', e);
                return cb({
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, msg, null)
                });
            }
        }
    }

    return SalesforceChangePasswordController;
};