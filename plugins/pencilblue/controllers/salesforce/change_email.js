'use strict';

module.exports = function SalesforceChangeEmailModule(pb) {
    const SalesforceAPIController = require('../api/salesforce/salesforce_api')(pb);

    class SalesforceChangeEmailController extends SalesforceAPIController {
        render(cb) {
            this.sanitizeObject(this.body);
            this.changeEmail(cb);
        }
    }

    return SalesforceChangeEmailController;
};
