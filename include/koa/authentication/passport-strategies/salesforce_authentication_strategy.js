const OAuth2Strategy = require('passport-oauth2').Strategy;
const strategyServices = require('./strategy_services');
const options = {
    authorizationURL: 'https://login.salesforce.com/services/oauth2/authorize',
    tokenURL: 'https://login.salesforce.com/services/oauth2/token',
    clientID: '3MVG9zlTNB8o8BA2.9x0lWeUFcLcXLWfQT4tN5R5vkK2Dh9eJjBBSH9l1RY1nP8gkR7UY0ll7B3srQgpxs00h',
    clientSecret: '1051763833577322271',
    callbackURL: 'https://bravo.lvh.me:8080/login/salesforce/callback'
};
const request = require('request-promise');

module.exports = (pb) => {
    function _getQuery(loginContext) {
        const usernameSearchExp = pb.regexUtil.getCaseInsensitiveExact(loginContext.username);

        let query = {
            object_type: 'user',
            '$or': [{
                username: usernameSearchExp
            }, {
                email: usernameSearchExp
            }],
            password: pb.security.encrypt(loginContext.password)
        };

        //check for required access level
        if (!isNaN(loginContext.access_level)) {
            query.admin = {
                '$gte': loginContext.access_level
            };
        }

        return query;
    };

    async function action(req, accessToken, refreshToken, profile, done) {
        console.log('_______ x _______\n', {
            accessToken,
            refreshToken,
            profile
        });
        const user = await request.get(`https://login.salesforce.com/services/oauth2/userinfo?format=json&access_token=${accessToken}`);
        console.log('_______ user _______\n', {
            user
        });
        done(null, user);
    }

    return new OAuth2Strategy(options, action);
};