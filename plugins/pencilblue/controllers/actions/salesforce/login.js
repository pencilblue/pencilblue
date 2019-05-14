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
            this.salesforceSSO(cb);
        }

        async salesforceSSO(cb) {
            const salesforceStrategyService = new SalesforceStrategyService();
            const options = await salesforceStrategyService.getSalesforceLoginSettings(this.req);
            if (this.query.state) {
                if (this.query.state.redirectURL) {
                    this.query.state.redirectURL = encodeURIComponent(this.query.state.redirectURL);
                }
                options.url += `&state=${this.query.state}`;
            }

            request(options)
                .on('response', (response) => {
                    const currentUrl = this.req && this.req.url;
                    const responseHeader = response && response.headers;

                    this.log.info(`Salesforce Login Redirection here:
                        Current URL is: ${currentUrl}
                        Response header is: ${JSON.stringify(responseHeader)}`);
                })
                .pipe(this.res)
        }
    }

    return LoginSFSSOController;
};
