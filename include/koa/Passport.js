const Promise = require('bluebird');
const CustomStrategy = require('passport-custom').Strategy;
const LocalStrategy = require('passport-local').Strategy;

module.exports = () => {
    return (pb) => {
        const RegExpUtils = require('../utils/reg_exp_utils');

        // Passport dependencies
        const passport = require('koa-passport');

        passport.serializeUser(function (user, done) {
            done(null, user);
        });

        passport.deserializeUser(async function (user, done) {
            done(null, user);
        });
        passport.use(new CustomStrategy(async function (req, done) {
            let loginContext = req.session._loginContext || {};
            if(!loginContext.username || !loginContext.password) {
                return done(new Error("UsernamePasswordAuthentication: The username and password must be passed as part of the credentials object: " + credentials), null);
            }

            const usernameSearchExp = RegExpUtils.getCaseInsensitiveExact(loginContext.username);

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

            let dao;
            if (loginContext.site) {
                dao = Promise.promisifyAll(new pb.SiteQueryService({
                    site: loginContext.site,
                    onlyThisSite: false
                }));
            } else {
                dao = Promise.promisifyAll(new pb.DAO());
            }

            //search for user
            let user;

            try {
                user = await dao.loadByValuesAsync(query, 'user') || {};
            } catch (err) {
                pb.log.error(`Failed to get user during authentication. ${err}`);
                return done(null, false);
            }

            delete user.password;

            //build out session object
            user.permissions                   = pb.PluginService.getPermissionsForRole(user.admin);
            req.session.authentication.user        = user;
            req.session.authentication.user_id     = user[pb.DAO.getIdField()].toString();
            req.session.authentication.admin_level = user.admin;

            //set locale if no preference already indicated for the session
            if (!req.session.locale) {
                req.session.locale = user.locale;
            }

            delete req.session._loginContext;
            done(null, user);
        }));

        return passport;
    };
};
