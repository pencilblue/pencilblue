const CustomStrategy = require('passport-custom').Strategy;
const strategyServices = require('./strategy_services');
const request = require('request-promise');

module.exports = (pb) => {
    async function salesforceCallback(req, done) {
        var state = req.url.query.state;
        var sfdcURL = 'https://login.salesforce.com/services/oauth2/token';
        if (state == 'webServerSandbox') {
            sfdcURL = 'https://test.salesforce.com/services/oauth2/token';
        }

        const clientId = '3MVG9zlTNB8o8BA2.9x0lWeUFcLcXLWfQT4tN5R5vkK2Dh9eJjBBSH9l1RY1nP8gkR7UY0ll7B3srQgpxs00h',
            consumer_secret = '1051763833577322271',
            jwt_aud = 'https://login.salesforce.com',
            callbackURL = 'https://bravo.lvh.me:8080/login/salesforce/callback';

        let response = await request({
            url: sfdcURL + '?client_id=' +
                clientId + '&redirect_uri=' +
                callbackURL + '&grant_type=authorization_code&code=' +
                req.url.query.code + '&client_secret' + consumer_secret,
            method: 'POST'
        });
        response = JSON.parse(response);
        const accessToken = response.access_token;
        console.log('______ token ______\n', accessToken, response);
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
        const sfdcURL = 'https://login.salesforce.com/services/oauth2/authorize';
        const clientId = '3MVG9zlTNB8o8BA2.9x0lWeUFcLcXLWfQT4tN5R5vkK2Dh9eJjBBSH9l1RY1nP8gkR7UY0ll7B3srQgpxs00h',
            consumer_secret = '1051763833577322271',
            jwt_aud = 'https://login.salesforce.com',
            callbackURL = 'https://bravo.lvh.me:8080/login/salesforce/callback'
        const options = {
            url: sfdcURL + '?client_id=' +
                clientId + '&redirect_uri=' +
                callbackURL + '&response_type=code&state=' + state,
            method: 'GET'
        };
        return done(null, options);
    }

    return {
        salesforceCallback: new CustomStrategy(salesforceCallback),
        salesforce: new CustomStrategy(salesforce)
    };
};