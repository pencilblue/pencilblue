const request = require('request-promise');
const Promise = require('bluebird');
let salesforceAPIUrl;
const isSandbox = process.env.USE_SALESFORCE_SANDBOX === 'true';
const OAUTH_TOKEN_SERVICE = '/services/oauth2/token';
const OAUTH_AUTHORIZE_SERVICE = '/services/oauth2/authorize';
const OAUTH_REVOKE_SERVICE = '/services/oauth2/revoke';

if (isSandbox) {
    salesforceAPIUrl = process.env.SALESFORCE_SANDBOX_API_URL;
} else {
    salesforceAPIUrl = process.env.salesforceAPIUrl;
}

let salesforceOAUTHTokenService = salesforceAPIUrl + OAUTH_TOKEN_SERVICE,
    salesforceOAUTHAuthorizeService = salesforceAPIUrl + OAUTH_AUTHORIZE_SERVICE,
    salesforceOAuthRevokeService = salesforceAPIUrl + OAUTH_REVOKE_SERVICE;

module.exports = function(pb) {
    const AuthStrategyService = require('../authentication/auth_strategy_service')(pb);
    class SalesforceStrategyService {
        constructor() {
            this.siteQueryService = new pb.SiteQueryService();
            this.authStrategyServices = new AuthStrategyService();
        }

        async logout(req) {
            try {
                const token = req.session.authentication.user.salesforce.authorize.access_token;
                const settings = await this.getSalesforceSettings(req);
                const options = {
                    url: `${salesforceOAuthRevokeService}?token=${token}`,
                    method: 'GET'
                };
                await request(options);
                return {
                    serverSideCustomLogoutRequest: settings.server_custom_logout_request,
                    enableCustomLogout: settings.enable_custom_logout_url,
                    url: settings.custom_logout_url
                };
            } catch (e) {
                pb.log.error('Something went wrong during salesforce logout strategy: ', e);
                return null;
            }
        }

        async register(req) {
            try {
                const settings = await this.getSalesforceSettings(req);
                return {
                    enableCustomRegister: settings.enable_custom_register_url,
                    url: settings.custom_register_url,
                    hackUserAuthFlow: settings.force_auth_process_for_register,
                    toReplace: settings.register_string_to_replace,
                    replacement: settings.register_replacement_string
                };
            } catch (e) {
                pb.log.error('Something went wrong during salesforce register: ', e);
                return null;
            }
        }

        async getSalesforceCallbackSettings(req) {
            const options = {
                addPrefix: req.siteObj && req.siteObj.prefix
            }

            if (options.addPrefix) {
                options.prefix = req.siteObj.prefix;
            }

            return options;
        }

        async getSalesforceLoginSettings(req) {
            try {
                const settings = await this.getSalesforceSettings(req);
                const options = {
                    url: `${salesforceOAUTHAuthorizeService}?client_id=${settings.salesforce_client_id}&redirect_uri=${this.getCallBackURL(req)}&response_type=code&prompt=login`,
                    method: 'POST'
                };
                return options;
            } catch (e) {
                pb.log.error('Something went wrong during salesforce SSO strategy: ', e);
                return null;
            }
        }

        async salesforceCallback(req, code) {
            try {
                const loginContext = req.session._loginContext || {};
                const settings = await this.getSalesforceSettings(req);
                const options = {
                    url: `${salesforceOAUTHTokenService}?client_id=${settings.salesforce_client_id}&redirect_uri=${this.getCallBackURL(req)}&grant_type=authorization_code&code=${code}&client_secret=${settings.salesforce_client_secret}`,
                    method: 'POST',
                    json: true
                };
                const response = await request(options);
                const accessToken = response.access_token;
                let salesforceUser = await request({
                    url: `${salesforceAPIUrl}/services/oauth2/userinfo?format=json&access_token=${accessToken}`,
                    method: 'GET',
                    json: true
                });
                let user = {
                    external_user_id: salesforceUser.user_id,
                    first_name: salesforceUser.given_name,
                    last_name: salesforceUser.family_name,
                    username: salesforceUser.preferred_username,
                    email: salesforceUser.email,
                    admin: 0, // lowest admin level, used to forbid the access to the admin panel
                    object_type: 'user',
                    site: loginContext.site || '',
                    identity_provider: 'salesforce'
                };
                user = await this.authStrategyServices.saveUser(user, loginContext, true);
                user.salesforce = {
                    authorize: response,
                    profile: {
                        id: salesforceUser.user_id
                    }
                };
                const updateEmail = salesforceUser.email !== user.email;
                user.email = salesforceUser.email;
                this.authStrategyServices._addUserToSession(req, user);
                return {
                    user,
                    updateEmail
                };
            } catch (e) {
                pb.log.error('Something went wrong during salesforce callback strategy: ', e);
                return null;
            }
        }

        async getSalesforceSettings(req) {
            let pluginService = new pb.PluginService({
                site: req.site
            });
            pluginService = Promise.promisifyAll(pluginService);
            const settings = await pluginService.getSettingsKVAsync('tn_auth');
            if (settings.app_url && settings.app_url !== '') {
                salesforceOAUTHTokenService = settings.app_url + OAUTH_TOKEN_SERVICE;
                salesforceOAUTHAuthorizeService = settings.app_url + OAUTH_AUTHORIZE_SERVICE;
                salesforceOAuthRevokeService = settings.app_url + OAUTH_REVOKE_SERVICE;
                salesforceAPIUrl = settings.app_url;
            }
            return settings;
        }

        getCallBackURL(req) {
            let baseURL;

            if (req.siteObj.origin) {
                // just to be safe, but siteObj.origin should not contain a protocol
                if (!req.siteObj.origin.includes('http://') && !req.siteObj.origin.includes('https://')) {
                    baseURL = `https://${req.siteObj.origin}`;
                } else {
                    baseURL = `${req.siteObj.origin}`;
                }
            } else {
                baseURL = `https://${req.headers.host}`;
            }
            if (req.siteObj.prefix) {
                baseURL += `/${req.siteObj.prefix}`;
            }

            return `${baseURL}/login/salesforce/callback`;
        }
    };

    return SalesforceStrategyService;
};
