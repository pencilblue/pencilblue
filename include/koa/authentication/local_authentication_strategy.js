const CustomStrategy = require('passport-custom').Strategy;

module.exports = (pb) => {

    function _getDao (loginContext) {
        if (loginContext.site) {
            return new pb.SiteQueryService({
                site: loginContext.site,
                onlyThisSite: false
            });
        } else {
            return new pb.DAO();
        }
    }
    function _getQuery (loginContext) {
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
    }
    function _addUserToSession (req, user) {
        delete user.password;

        //build out session object
        user.permissions = pb.PluginService.getPermissionsForRole(user.admin);
        req.session.authentication.user = user;
        req.session.authentication.user_id = user[pb.DAO.getIdField()].toString();
        req.session.authentication.admin_level = user.admin;

        //set locale if no preference already indicated for the session
        if (!req.session.locale) {
            req.session.locale = user.locale;
        }

        delete req.session._loginContext; // Remove login context from session now its used
    }

    async function action(req, done) {
        let loginContext = req.session._loginContext || {};
        if (!loginContext.username || !loginContext.password) {
            return done(new Error("UsernamePasswordAuthentication: The username and password must be passed as part of the credentials object: " + credentials), null);
        }

        let query = _getQuery(loginContext);
        let dao = _getDao(loginContext);


        //search for user
        let user;

        try {
            user = await dao.loadByValuesAsync(query, 'user') || {};
        } catch (err) {
            pb.log.error(`Failed to get user during authentication. ${err}`);
            return done(null, false);
        }

        _addUserToSession(req, user);

        done(null, user);
    }
    
    return new CustomStrategy(action);
};
