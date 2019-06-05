'use strict';

const request = require('request');

module.exports = function LoginSFSSOControllerModule(pb) {
    /**
     * Authenticates a user via Salesforce
     * @class LoginSFActionControllerModule
     * @constructor
     */

    const SalesforceStrategyService = require('../../../services/salesforce/salesforce_strategy_service')(pb);
    class LoginSFSSOController extends pb.BaseController {
        render(cb) {
            this.sanitizeObject(this.body);
            if(this.req.session && this.req.session.authentication && this.req.session.authentication.user &&
                this.req.session.authentication.user.external_user_id){
                this.redirect (`/profile/view`,cb);
            }else{
                this.salesforceSSO(cb);
            }
        }

        async salesforceSSO(cb) {
            const salesforceStrategyService = new SalesforceStrategyService();
            const options = await salesforceStrategyService.getSalesforceLoginSettings(this.req);
            if (this.query.state) {
                try {
                    let state = JSON.parse(this.query.state);
                    if (state.redirectURL) {
                        state.redirectURL = encodeURIComponent(state.redirectURL);
                    }
                    options.url += `&state=${JSON.stringify(state)}`;
                } catch (e) {
                    pb.log.warn('Something went wrong during the state parsing: ', e);
                }
            }

            request(options)
                .on('response', (response) => {
                    const currentUrl = this.req && this.req.url;
                    const responseHeader = response && response.headers;
                    responseHeader.location += `&lang=${this.ls.language}`;
                    this.log.info(`Salesforce Login Redirection here:
                        Current URL is: ${currentUrl}
                        Response header is: ${JSON.stringify(responseHeader)}`);
                })
                .pipe(this.res)
        }
    }

    return LoginSFSSOController;
};
