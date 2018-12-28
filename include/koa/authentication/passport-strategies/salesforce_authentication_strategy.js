const CustomStrategy = require('passport-custom').Strategy;
const strategyServices = require('./strategy_services');
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

module.exports = (pb) => {
    async function getSalesforceSettings(req) {
        let pluginService = new pb.PluginService({
            site: req.ctx.__site
        });
        pluginService = Promise.promisifyAll(pluginService);
        const settings = await pluginService.getSettingsKVAsync('tn_join');
        if (settings.app_url && settings.app_url !== '') {
            salesforceOAUTHTokenService = settings.app_url + OAUTH_TOKEN_SERVICE;
            salesforceOAUTHAuthorizeService = settings.app_url + OAUTH_AUTHORIZE_SERVICE;
            salesforceAPIUrl = settings.app_url;
        }
        return settings;
    }

    async function salesforceCallback(req, done) {
        try {
            const loginContext = req.session._loginContext || {};
            const code = req.url.query.code;
            const settings = await getSalesforceSettings(req);
            const options = {
                url: `${salesforceOAUTHTokenService}?client_id=${settings.salesforce_client_id}&redirect_uri=https://${req.header.host}/login/salesforce/callback&grant_type=authorization_code&code=${code}&client_secret=${settings.salesforce_client_secret}`,
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
                first_name: salesforceUser.given_name,
                last_name: salesforceUser.family_name,
                username: salesforceUser.preferred_username,
                email: salesforceUser.email,
                admin: 0,
                object_type: 'user',
                site: loginContext.site || '',
                identity_provider: 'salesforce'
            };
            user = await strategyServices.saveUser(user, loginContext, done, pb, true);
            user.salesforce = {
                authorize: response,
                profile: {
                    id: salesforceUser.user_id
                }
            };
            strategyServices._addUserToSession(req, user, pb);
            return done(null, user);
        } catch (e) {
            pb.log.error('Something went wrong during passport\'s salesforce callback strategy: ', e);
            return done(e, null);
        }
    }

    async function salesforceSSO(req, done) {
        try {
            const settings = await getSalesforceSettings(req);
            const options = {
                url: `${salesforceOAUTHAuthorizeService}?client_id=${settings.salesforce_client_id}&redirect_uri=https://${req.header.host}/login/salesforce/callback&response_type=code&state=${state}`,
                method: 'POST'
            };
            return done(null, options);
        } catch (e) {
            pb.log.error('Something went wrong during passport\'s salesforce SSO strategy: ', e);
            return done(e, null);
        }
    }

    return {
        salesforceCallback: new CustomStrategy(salesforceCallback),
        salesforceSSO: new CustomStrategy(salesforceSSO)
    };
};