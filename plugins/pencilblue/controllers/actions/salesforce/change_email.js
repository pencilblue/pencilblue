'use strict';

const passport = require('koa-passport');
const request = require('request-promise');

module.exports = function SalesforceChangeEmailControllerModule(pb) {

    //dependencies
    /**
     * Changes an user email
     * @class SalesforceChangeEmailController
     * @constructor
     */
    class SalesforceChangeEmailController extends pb.BaseController {
        render(cb) {
            this.sanitizeObject(this.body);
            this.changeEmail(cb);
        }

        async changeEmail(cb) {
            try {
                const user = this.ctx.session.authentication.user;
                if (user && user.salesforce) {
                    const url = `${user.salesforce.authorize.instance_url}/services/data/v44.0/sobjects/User/${user.salesforce.profile.id}`;
                    const response = await request({
                        method: 'PATCH',
                        uri: url,
                        body: {
                            Email: this.body.newEmail
                        },
                        headers: {
                            Authorization: `Bearer ${user.salesforce.authorize.access_token}`
                        },
                        json: true
                    });
                } else {
                    pb.log.error('User is not logged in via salesforce: ', user);
                    return cb({
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'User is not logged in via salesforce', null)
                    });
                }
                return cb({
                    content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, undefined, null)
                });
            } catch (e) {
                let msg = Array.isArray(e.error) && e.error.length > 0 ? e.error[0].message : 'Something went wrong during the api call';
                pb.log.error('Something went wrong during the change salesforce email call: ', e);
                return cb({
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, msg, null)
                });
            }
        }
    }

    return SalesforceChangeEmailController;
};