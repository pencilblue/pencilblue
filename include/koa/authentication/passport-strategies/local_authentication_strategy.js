const CustomStrategy = require('passport-custom').Strategy;
const strategyServices = require('./strategy_services');

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

    async function action(req, done) {
        let loginContext = req.session._loginContext || {};
        if (!loginContext.username || !loginContext.password) {
            return done(new Error("UsernamePasswordAuthentication: The username and password must be passed as part of the credentials object: " + credentials), null);
        }

        let query = _getQuery(loginContext);
        let dao = strategyServices._getDao(loginContext, pb);


        //search for user
        let user;

        try {
            user = await dao.loadByValuesAsync(query, 'user') || {};
        } catch (err) {
            pb.log.error(`Failed to get user during authentication. ${err}`);
            return done(null, false);
        }

        strategyServices._addUserToSession(req, user, pb);

        done(null, user);
    }

    return new CustomStrategy(action);
};