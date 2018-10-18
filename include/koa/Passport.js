module.exports = () => {
    return (pb, app) => {
        console.log('_____ here I am _____');
        const util = require('../util.js');
        const RegExpUtils = require('../utils/reg_exp_utils');

        const Promise = require('bluebird');

        // Passport dependencies
        const passport = require('koa-passport');
        const LocalStrategy = require('passport-local').Strategy;
        return async (ctx, next) => {
            console.log('_____ rock you like a hurricane _____\n');
            passport.serializeUser(function(user, done) {
                done(null, user);
            });

            passport.deserializeUser(async function(user, done) {
                done(null, user);
            });
            passport.use(new LocalStrategy(async function(credentials, done) {
                console.log('_____ credentials _____\n', credentials);
                if (!util.isObject(credentials) || !util.isString(credentials.username) || !util.isString(credentials.password)) {
                    return done(new Error("UsernamePasswordAuthentication: The username and password must be passed as part of the credentials object: " + credentials), null);
                }

                const usernameSearchExp = RegExpUtils.getCaseInsensitiveExact(credentials.username);

                let query = {
                    object_type: 'user',
                    '$or': [{
                        username: usernameSearchExp
                    }, {
                        email: usernameSearchExp
                    }],
                    password: credentials.password
                };

                //check for required access level
                if (!isNaN(credentials.access_level)) {
                    query.admin = {
                        '$gte': credentials.access_level
                    };
                }

                let dao;
                if (credentials.site) {
                    dao = Promise.promisifyAll(new pb.SiteQueryService({
                        site: credentials.site,
                        onlyThisSite: false
                    }));
                } else {
                    dao = Promise.promisifyAll(new pb.DAO());
                }
                //search for user
                const result = await dao.loadByValuesAsync(query, 'user');
                done();
            }));
            app.use(passport.initialize());
            app.use(passport.session());
            await next();
        };
    };
};