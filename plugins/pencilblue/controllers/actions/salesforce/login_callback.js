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
            const response = await salesforceStrategyService.salesforceCallback(this.req, this.query.code);
            if (!response) {
                return this.loginError(cb);
            }
            let state;
            if (this.query.state) {
                try {
                    state = JSON.parse(this.query.state);
                } catch (e) {
                    state = null;
                    pb.log.warn('Something went wrong during the state parsing: ', e);
                }
            }
            let redirectLocation = await this.getRedirectLink(response, state);
            this.redirect(redirectLocation, cb);
        }

        _setupLoginContext() {
            let options = this.body || {};
            options.site = this.site;
            options.access_level = pb.SecurityService.ACCESS_USER;
            this.req.session._loginContext = options;
        }

        async getRedirectLink(user, state) {
            let location = '/';
            const siteQueryService = new pb.SiteQueryService();
            const query = {
                externalUserId: user.external_user_id,
                object_type: 'jobseeker_profile'
            };
            const hasJobSeekerProfile = await siteQueryService.loadByValuesAsync(query, 'jobseeker_profile');
            if (state && state.highPriorityToRegister && !hasJobSeekerProfile) {
                location = `/${this.req.localizationService.language}/profile/create-profile`;
            } else if (state && state.redirectURL) {
                location = state.redirectURL;
            } else if (this.session.on_login) {
                location = this.session.on_login;
                delete this.session.on_login;
            } else if (!hasJobSeekerProfile) {
                // redirect to create-profile if the user don't have a created jobseeker profile
                location = `/${this.req.localizationService.language}/profile/create-profile`;
            } else {
                location = `/${this.req.localizationService.language}/profile/view`;
            }
            if (state) {
                location += `?state=${JSON.stringify(state)}`;
            }
            return location;
        }
    }

    //exports
    return LoginSalesforceCallbackController;
};