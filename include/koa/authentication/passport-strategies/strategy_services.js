function _getDao(loginContext, pb) {
    if (loginContext.site) {
        return new pb.SiteQueryService({
            site: loginContext.site,
            onlyThisSite: false
        });
    } else {
        return new pb.DAO();
    }
};

function _addUserToSession(req, user, pb) {
    delete user.password;

    //build out session object
    user.permissions = pb.PluginService.getPermissionsForRole(user.admin);
    req.session.authentication.user = user || {};
    req.session.authentication.user_id = user[pb.DAO.getIdField()].toString();
    req.session.authentication.admin_level = user.admin;

    //set locale if no preference already indicated for the session
    if (!req.session.locale) {
        req.session.locale = user.locale;
    }

    delete req.session._loginContext; // Remove login context from session now its used
};

module.exports = {
    _getDao,
    _addUserToSession
};