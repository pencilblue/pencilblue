'use strict';

const request = require('request-promise');

module.exports = function RegisterSFControllerModule(pb) {
    /**
     * Registers a user via Salesforce
     * @class RegisterSFControllerModule
     * @constructor
     */

    const SalesforceStrategyService = require('../../../services/salesforce/salesforce_strategy_service')(pb);
    class RegisterSFController extends pb.BaseController {
        render(cb) {
            this.sanitizeObject(this.body);
            this.salesforceRegister(cb);
        }

        async salesforceRegister(cb) {
            const salesforceStrategyService = new SalesforceStrategyService();
            let response = await salesforceStrategyService.register(this.req);

            if (response && response.enableCustomRegister && response.url) {
                this.redirect(response.url, cb);
            } else {
                this.redirect('/login/salesforce', cb);
            }
        }
    }

    return RegisterSFController;
};
