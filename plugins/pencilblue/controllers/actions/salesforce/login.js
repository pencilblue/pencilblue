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
            request(options).pipe(this.res);
        }
    }

    return LoginSFSSOController;
};