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
                if (response.hackUserAuthFlow) {
                    const options = await salesforceStrategyService.getSalesforceLoginSettings(this.req);
                    if (this.query.state) {
                        options.url += `&state=${this.query.state}`;
                    }
                    request(options)
                        .on('response', (rsp) => {
                            rsp.headers.location = rsp.headers.location.replace(response.toReplace, response.replacement);
                            rsp.headers.location += `&lang=${this.ls.language}`;
                        }).pipe(this.res);
                } else {
                    this.redirect(response.url, cb);
                    request(options)
                        .on('response', (rsp) => {
                            rsp.headers.location += `&lang=${this.ls.language}`;
                        })
                        .pipe(this.res)
                }
            } else {
                this.redirect('/login/salesforce', cb);
            }
        }
    }

    return RegisterSFController;
};
