const CustomStrategy = require('passport-custom').Strategy;
const strategyServices = require('./strategy_services');
const request = require('request-promise');
const Promise = require('bluebird');
const SALESFORCE_OAUTH_TOKEN_URL = process.env.SALESFORCE_OAUTH_TOKEN_URL || '';
const SALESFORCE_OAUTH_AUTHORIZE_URL = process.env.SALESFORCE_OAUTH_AUTHORIZE_URL || '';

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
        const state = req.url.query.state;
        const code = req.url.query.code;
        const settings = await getSalesforceSettings(req);
        const options = {
            url: `${SALESFORCE_OAUTH_TOKEN_URL}?client_id=${settings.salesforce_client_id}&redirect_uri=${settings.salesforce_callback_url}&grant_type=authorization_code&code=${code}&client_secret=${settings.salesforce_client_secret}`,
            method: 'POST',
            json: true
        };
        const response = await request(options);
        const accessToken = response.access_token;
        let user = await request.get(`https://login.salesforce.com/services/oauth2/userinfo?format=json&access_token=${accessToken}`);
        user = JSON.parse(user);
        user.token = accessToken;
        done(null, {
            code: 200,
            content: user
        });

    }

    async function salesforce(req, done) {
        const state = 'webServerProd';
        const settings = await getSalesforceSettings(req);
        const options = {
            url: `${SALESFORCE_OAUTH_AUTHORIZE_URL}?client_id=${settings.salesforce_client_id}&redirect_uri=${settings.salesforce_callback_url}&response_type=code&state=${state}`,
            method: 'GET'
        };
        return done(null, options);
    }

    return {
        salesforceCallback: new CustomStrategy(salesforceCallback),
        salesforce: new CustomStrategy(salesforce)
    };
};