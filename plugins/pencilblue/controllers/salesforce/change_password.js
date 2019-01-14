'use strict';

module.exports = function SalesforceChangePasswordModule(pb) {
    const SalesforceAPIController = require('../api/salesforce/salesforce_api')(pb);

    class SalesforceChangePasswordController extends SalesforceAPIController {
        render(cb) {
            this.sanitizeObject(this.body);
            this.changePassword(cb);
        }
    }

    return SalesforceChangePasswordController;
};
