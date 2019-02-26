'use strict';

module.exports = function LoginSalesforceCallbackControllerModule(pb) {
    const SalesforceStrategyService = require('../../../services/salesforce/salesforce_strategy_service')(pb);
    /**
     * Authenticates a user
     * @class LoginSalesforceCallbackController
     * @constructor
     */
    class LoginSalesforceCallbackController extends pb.BaseController {
        render(cb) {
            this.sanitizeObject(this.body);
            this._setupLoginContext();
            this._doLogin(cb);
        }
        loginError(cb) {
            this.session.error = this.ls.g('login.INVALID_LOGIN');
            if (this.isAdminLogin) {
                return this.redirect('/admin/login', cb);
            }

            return this.redirect('/user/login', cb);
        };


        async _doLogin(cb) {
            const salesforceStrategyService = new SalesforceStrategyService();
            let redirectLocation = this.redirectLink;
            const response = await salesforceStrategyService.salesforceCallback(this.req, this.query.code);
            if (!response) {
                return this.loginError(cb);
            }
            this.redirect('/', cb);
        }

        _setupLoginContext() {
            let options = this.body || {};
            options.site = this.site;
            options.access_level =  pb.SecurityService.ACCESS_USER;
            this.req.session._loginContext = options;
        }

        get redirectLink() {
            let location = '/';
            if (this.session.on_login) {
                location = this.session.on_login;
                delete this.session.on_login;
            }
            return location;
        }
    }

    //exports
    return LoginSalesforceCallbackController;
};