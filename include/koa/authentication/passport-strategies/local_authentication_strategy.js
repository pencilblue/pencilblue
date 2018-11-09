const CustomStrategy = require('passport-custom').Strategy;
const strategyServices = require('./strategy_services');

module.exports = (pb) => {
    async function action(req, done) {
        try {
            let loginContext = req.session._loginContext || {};
            if (!loginContext.username || !loginContext.password) {
                return done(new Error("UsernamePasswordAuthentication: The username and password must be passed as part of the credentials object: " + credentials), null);
            }
            user = await strategyServices.getUser(loginContext, done, pb);
            if (!user) {
                return done(new Error("UsernamePasswordAuthentication: Invalid username or password"), null);
            }
            strategyServices._addUserToSession(req, user, pb);
            done(null, user);
        } catch (e) {
            pb.log.error('Something went wrong during passport\'s local strategy: ', e);
            return done(e, null);
        }
    }

    return new CustomStrategy(action);
};