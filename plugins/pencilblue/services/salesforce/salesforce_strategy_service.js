const request = require('request-promise');
const Promise = require('bluebird');
let state, salesforceAPIUrl;
const isSandbox = process.env.USE_SALESFORCE_SANDBOX === 'true';
const OAUTH_TOKEN_SERVICE = '/services/oauth2/token';
const OAUTH_AUTHORIZE_SERVICE = '/services/oauth2/authorize';
if (isSandbox) {
    salesforceAPIUrl = process.env.SALESFORCE_SANDBOX_API_URL;
    state = 'webServerSandbox';
} else {
    salesforceAPIUrl = process.env.salesforceAPIUrl;
    state = 'webServerProd';
}

let salesforceOAUTHTokenService = salesforceAPIUrl + OAUTH_TOKEN_SERVICE,
    salesforceOAUTHAuthorizeService = salesforceAPIUrl + OAUTH_AUTHORIZE_SERVICE;

module.exports = function(pb) {
    const AuthStrategyService = require('../authentication/auth_strategy_service')(pb);
    class SalesforceStrategyService {
        constructor() {
            this.siteQueryService = new pb.SiteQueryService();
            this.authStrategyServices = new AuthStrategyService();
        }

        async getSalesforceLoginSettings(req) {
            try {
                const settings = await this.getSalesforceSettings(req);
                const options = {
                    url: `${salesforceOAUTHAuthorizeService}?client_id=${settings.salesforce_client_id}&redirect_uri=https://${req.headers.host}/login/salesforce/callback&response_type=code&state=${state}`,
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
                    url: `${salesforceOAUTHTokenService}?client_id=${settings.salesforce_client_id}&redirect_uri=https://${req.headers.host}/login/salesforce/callback&grant_type=authorization_code&code=${code}&client_secret=${settings.salesforce_client_secret}`,
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
                    admin: 0,
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
                this.authStrategyServices._addUserToSession(req, user);
                return user;
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
                salesforceAPIUrl = settings.app_url;
            }
            return settings;
        }
    };

    return SalesforceStrategyService;
};