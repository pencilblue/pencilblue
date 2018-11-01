const CustomStrategy = require('passport-custom').Strategy;
const strategyServices = require('./strategy_services');

module.exports = (pb) => {
    async function action(req, done) {
        let loginContext = req.session._loginContext || {};
        if (!loginContext.username || !loginContext.password) {
            return done(new Error("UsernamePasswordAuthentication: The username and password must be passed as part of the credentials object: " + credentials), null);
        }
        user = await strategyServices.getUser(loginContext, done, pb);
        strategyServices._addUserToSession(req, user, pb);
        done(null, user);
    }

    return new CustomStrategy(action);
};