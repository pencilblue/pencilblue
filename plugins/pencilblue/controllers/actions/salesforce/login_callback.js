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
            this._doLoginCallback(cb);
        }
        loginError(cb) {
            this.session.error = this.ls.g('login.INVALID_LOGIN');
            if (this.isAdminLogin) {
                return this.redirect('/admin/login', cb);
            }

            return this.redirect('/', cb);
        };


        async _doLoginCallback(cb) {
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
            if (response.updateEmail) {
                await this.updateEmail(response.user);
            }
            let redirectLocation = await this.getRedirectLink(response.user, state, salesforceStrategyService);
            this.redirect(redirectLocation, cb);
        }

        async updateEmail(user) {
            try {
                this.identityProviderService = this.createService('IdentityProviderService', 'tn_auth');
                this.encryptProfileIdService = pb.PluginService.isPluginActiveBySite('tn_profile', this.site) ? this.createService('EncryptProfileIdService', 'tn_profile') : null;
                // update user, jobseeker_profile collections and matrix jobseeker_profile table
                const siteQueryService = new pb.SiteQueryService();
                const jobseekerProfile = await siteQueryService.loadByValuesAsync({
                    externalUserId: user.external_user_id,
                    object_type: 'jobseeker_profile'
                }, 'jobseeker_profile');
                let encryptedProfileDID = null;
                if (jobseekerProfile && this.encryptProfileIdService) {
                    encryptedProfileDID = await this.encryptProfileIdService.encrypt(jobseekerProfile.profileDID);
                }
                await this.identityProviderService.updateUserEmail(user.external_user_id, user.email, encryptedProfileDID);
            } catch (e) {
                pb.log.warn('Something went wrong during the email update: ', e);
            }
        }

        _setupLoginContext() {
            let options = this.body || {};
            options.site = this.site;
            options.access_level = pb.SecurityService.ACCESS_USER;
            this.req.session._loginContext = options;
        }

        async getRedirectLink(user, state, salesforceStrategyService) {
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
                // redirect to create-profile if the user doesn't have a created jobseeker profile
                location = `/${this.req.localizationService.language}/profile/create-profile`;
            } else {
                location = `/${this.req.localizationService.language}/profile/view`;
            }
            if (state) {
                if (state.redirectURL) {
                    state.redirectURL = encodeURIComponent(state.redirectURL);
                }
                let token = location.includes('?') ? '&' : '?';
                location += `${token}state=${JSON.stringify(state)}`;
            }

            const options = await salesforceStrategyService.getSalesforceCallbackSettings(this.req);

            if (options.addPrefix && location.indexOf(options.prefix) !== 1) {
                location = `/${options.prefix}${location}`;
            }

            pb.log.info(`callback redirection URL: ${location}`);
            return location;
        }
    }

    //exports
    return LoginSalesforceCallbackController;
};