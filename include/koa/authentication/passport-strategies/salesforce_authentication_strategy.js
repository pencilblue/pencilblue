const CustomStrategy = require('passport-custom').Strategy;
const strategyServices = require('./strategy_services');
const request = require('request-promise');
const Promise = require('bluebird');
let SALESFORCE_OAUTH_TOKEN_URL, SALESFORCE_OAUTH_AUTHORIZE_URL, state, SALESFORCE_API_URL;
const isSandbox = process.env.USE_SALESFORCE_SANDBOX === 'true';
if (isSandbox) {
    SALESFORCE_OAUTH_TOKEN_URL = process.env.SALESFORCE_SANDBOX_OAUTH_TOKEN_URL || '';
    SALESFORCE_OAUTH_AUTHORIZE_URL = process.env.SALESFORCE_SANDBOX_OAUTH_AUTHORIZE_URL || '';
    state = 'webServerSandbox';
    SALESFORCE_API_URL = 'https://test.salesforce.com';
} else {
    SALESFORCE_OAUTH_TOKEN_URL = process.env.SALESFORCE_OAUTH_TOKEN_URL || '';
    SALESFORCE_OAUTH_AUTHORIZE_URL = process.env.SALESFORCE_OAUTH_AUTHORIZE_URL || '';
    state = 'webServerProd';
    SALESFORCE_API_URL = 'https://login.salesforce.com';
}

module.exports = (pb) => {
    async function getSalesforceSettings(req) {
        let pluginService = new pb.PluginService({
            site: req.ctx.__site
        });
        pluginService = Promise.promisifyAll(pluginService);
        const settings = await pluginService.getSettingsKVAsync('tn_join');
        return settings;
    }

    async function salesforceCallback(req, done) {
        try {
            const loginContext = req.session._loginContext || {};
            const code = req.url.query.code;
            const settings = await getSalesforceSettings(req);
            const options = {
                url: `${SALESFORCE_OAUTH_TOKEN_URL}?client_id=${settings.salesforce_client_id}&redirect_uri=${settings.salesforce_callback_url}&grant_type=authorization_code&code=${code}&client_secret=${settings.salesforce_client_secret}`,
                method: 'POST',
                json: true
            };
            const response = await request(options);
            const accessToken = response.access_token;
            let salesforceUser = await request({
                url: `${SALESFORCE_API_URL}/services/oauth2/userinfo?format=json&access_token=${accessToken}`,
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
                site: loginContext.site || ''
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
                url: `${SALESFORCE_OAUTH_AUTHORIZE_URL}?client_id=${settings.salesforce_client_id}&redirect_uri=${settings.salesforce_callback_url}&response_type=code&state=${state}`,
                method: 'GET'
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