module.exports = function(pb) {

    class AuthStrategyService {
        constructor() {
        }

        getSiteQueryService(loginContext) {
            if (loginContext.site) {
                return new pb.SiteQueryService({
                    site: loginContext.site,
                    onlyThisSite: false
                });
            } else {
                return new pb.SiteQueryService();
            }
        };

        async _addUserToSession(req, user) {
            delete user.password;

            //build out session object
            user.permissions = pb.PluginService.getPermissionsForRole(user.admin);
            req.session.authentication.user = user || {};
            req.session.authentication.user_id = user[pb.DAO.getIdField()] ? user[pb.DAO.getIdField()].toString() : null;
            req.session.authentication.admin_level = user.admin;

            //set locale if no preference already indicated for the session
            if (!req.session.locale) {
                req.session.locale = user.locale;
            }

            delete req.session._loginContext; // Remove login context from session now its used
        };

        _getQuery(loginContext, identityProvider, ignorePassword) {
            const usernameSearchExp = pb.regexUtil.getCaseInsensitiveExact(loginContext.username);
            let query = {
                object_type: 'user',
                identity_provider: identityProvider
            };
            if (identityProvider) {
                query.external_user_id = loginContext.externalUserId;
            } else {
                query['$or'] = [{
                    username: usernameSearchExp
                }, {
                    email: usernameSearchExp
                }];
            }
            if (!ignorePassword) {
                query.password = pb.security.encrypt(loginContext.password);
            }
            //check for required access level
            if (!isNaN(loginContext.access_level)) {
                query.admin = {
                    '$gte': loginContext.access_level
                };
            }
            return query;
        };

        async getUser(loginContext, identityProvider, ignorePassword = false) {
            //search for user
            let user;
            let query = this._getQuery(loginContext, identityProvider, ignorePassword);
            const siteQueryService = this.getSiteQueryService(loginContext);
            try {
                user = await siteQueryService.loadByValuesAsync(query, 'user');
            } catch (err) {
                pb.log.error(`Failed to get user during authentication. ${err}`);
                return false;
            }
            return user;
        }

        async saveUser(user, loginContext, ignorePassword = false) {
            let createdUser;
            const siteQueryService = this.getSiteQueryService(loginContext);
            let _loginContext;
            try {
                _loginContext = {
                    site: loginContext.site,
                    username: user.username,
                    externalUserId: user.external_user_id
                };
                createdUser = await this.getUser(_loginContext, user.identity_provider, true);
                if (!createdUser) {
                    await siteQueryService.saveAsync(user);
                    createdUser = await this.getUser(_loginContext, user.identity_provider, true);
                // } else if (createdUser && createdUser.email !== user.email) {
                //     await siteQueryService.updateFieldsAsync('user', {
                //         object_type: 'user',
                //         external_user_id: user.external_user_id
                //     }, {
                //         '$set': {
                //             email: user.email
                //         }
                //     });
                }
            } catch (err) {
                pb.log.error(`Failed to get createdUser during authentication. ${err}`);
                return false;
            }
            return createdUser;
        }
    };

    return AuthStrategyService;
};