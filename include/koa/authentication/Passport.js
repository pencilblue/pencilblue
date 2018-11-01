module.exports = () => {
    return (pb) => {
        const LocalAuthenticationStrategy = require('./passport-strategies/local_authentication_strategy');

        // Passport dependencies
        const passport = require('koa-passport');

        // TODO: fix serialize and deserialize
        passport.serializeUser(function (user, done) {
            done(null, user);
        });

        passport.deserializeUser(async function (user, done) {
            done(null, user);
        });

        passport.use('custom-local', LocalAuthenticationStrategy(pb));

        return passport;
    };
};
