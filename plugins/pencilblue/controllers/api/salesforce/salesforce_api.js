'use strict';

const request = require('request-promise');
module.exports = function SalesforceAPIModule(pb) {

    class SalesforceAPIController extends pb.BaseController {
        async salesforceRequest(method, url, body, isJSON, cb) {
            try {
                const user = this.ctx.session.authentication.user;
                if (user && user.salesforce) {
                    const response = await request({
                        method,
                        uri: url,
                        body,
                        headers: {
                            Authorization: `Bearer ${user.salesforce.authorize.access_token}`
                        },
                        json: isJSON
                    });
                } else {
                    pb.log.warn('User is not logged in via salesforce: ', user);
                    return cb({
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'User is not logged in via salesforce')
                    });
                }
                return cb({
                    content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS)
                });
            } catch (e) {
                let msg = Array.isArray(e.error) && e.error.length > 0 ? e.error[0].message : 'Something went wrong during the api call';
                pb.log.error('Something went wrong during the salesforce api call: ', e);
                return cb({
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, msg)
                });
            }
        }

        async changePassword(cb) {
            let url;
            const user = this.ctx.session.authentication.user;
            if (user && user.salesforce) {
                url = `${user.salesforce.authorize.instance_url}/services/data/v25.0/sobjects/User/${user.salesforce.profile.id}/password`;
            }
            const body = {
                NewPassword: this.body.newPassword
            };
            return await this.salesforceRequest('POST', url, body, true, cb);
        }

        async changeEmail(cb) {
            let url;
            const user = this.ctx.session.authentication.user;
            if (user && user.salesforce) {
                url = `${user.salesforce.authorize.instance_url}/services/data/v44.0/sobjects/User/${user.salesforce.profile.id}`;
            }
            const body = {
                Email: this.body.newEmail
            };
            return await this.salesforceRequest('PATCH', url, body, true, cb);
        }
    }

    return SalesforceAPIController;
};
