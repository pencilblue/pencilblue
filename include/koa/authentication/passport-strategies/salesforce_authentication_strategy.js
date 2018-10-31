const CustomStrategy = require('passport-custom').Strategy;
const strategyServices = require('./strategy_services');
const request = require('request-promise');
const SALESFORCE_OAUTH_TOKEN_URL = process.env.SALESFORCE_OAUTH_TOKEN_URL || '';
const SALESFORCE_OAUTH_AUTHORIZE_URL = process.env.SALESFORCE_OAUTH_AUTHORIZE_URL || '';

module.exports = (pb) => {
    const callbackURL = 'https://bravo.lvh.me:8080/login/salesforce/callback';
    const clientId = '3MVG9zlTNB8o8BA2.9x0lWeUFcLcXLWfQT4tN5R5vkK2Dh9eJjBBSH9l1RY1nP8gkR7UY0ll7B3srQgpxs00h';
    const clientSecret = '1051763833577322271';

    async function salesforceCallback(req, done) {
        const state = req.url.query.state;
        const code = req.url.query.code;
        const options = {
            url: `${SALESFORCE_OAUTH_TOKEN_URL}?client_id=${clientId}&redirect_uri=${callbackURL}&grant_type=authorization_code&code=${code}&client_secret=${clientSecret}`,
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

        const options = {
            url: `${SALESFORCE_OAUTH_AUTHORIZE_URL}?client_id=${clientId}&redirect_uri=${callbackURL}&response_type=code&state=${state}`,
            method: 'GET'
        };
        return done(null, options);
    }

    return {
        salesforceCallback: new CustomStrategy(salesforceCallback),
        salesforce: new CustomStrategy(salesforce)
    };
};