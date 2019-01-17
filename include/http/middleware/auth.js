const ErrorUtils = require('../../error/error_utils');
const util = require('util')

module.exports = pb => ({
    requiresAuthenticationCheck: (req, res) => {
        var context = {
            route: req.route,
            session: req.session,
            req: req,
            hostname: req.handler.hostname,
            url: req.handler.url
        };
        var result = pb.RequestHandler.checkRequiresAuth(context);
        if (result.redirect) {
            throw ErrorUtils.notAuthorized();
        }
    },
    authorizationCheck: (req, res) => {
        var context = {
            route: req.route,
            session: req.session
        };

        //check role
        var result = pb.RequestHandler.checkAdminLevel(context);
        if (!result.success) {
            throw ErrorUtils.forbidden();
        }

        //check permissions
        result = pb.RequestHandler.checkPermissions(context);
        if (!result.success && pb.log.isDebug()) {
            pb.log.debug(`AuthCheck: ${result.message}`);
        }
        if (!result.success) {
            throw ErrorUtils.forbidden();
        }
    },
    ipFilterCheck: async (req, res) => {
        if (pb.config.server.ipFilter.enabled && req.route.path.startsWith('/admin')) {
            const authorized = await util.promisify(pb.AdminIPFilter.requestIsAuthorized).call(pb.AdminIPFilter, req);
            if (!authorized) {
                throw ErrorUtils.forbidden();
            }
        }
    }
})
