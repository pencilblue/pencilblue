const util = require('util');


module.exports = pb => {
    function hasRightAdminLevel(ctx, route) {
        let accessLevelRequired = !!route.access_level;
        let hasRightAccessLevel = ctx.session.authentication.admin_level < route.access_level;

        if(accessLevelRequired && hasRightAccessLevel) {
            ctx.body = '403 Forbidden';
            ctx.status = 403;
            return false;
        }
        return true;
    }
    function hasCorrectPermission (ctx, route) {
        let routePermissions = route.permissions;
        let auth = ctx.session.authentication;

        let isAdmin = auth.admin_level !== pb.SecurityService.ACCESS_ADMINISTRATOR;
        let userPermissions = auth.user && auth.user.permissions;
        let isRoutePermissionsAnArray = util.isArray(routePermissions);

        if (userPermissions && !isAdmin && isRoutePermissionsAnArray) {
            let missingPermission = routePermissions.some((permission) => !userPermissions[permission]);

            if(missingPermission) {
                ctx.status = 403;
                ctx.body = '403 Forbidden';
                return false;
            }
        }
        return true;
    }

    let middleware = {
        requiresAuthenticationCheck: async (ctx, next) => {
            let req = ctx.req;
            let hostname = req.hostname;

            ctx.session.authentication = ctx.session.authentication || {};
            let authRequired = req.route.auth_required; // TODO: Determine if this needs updated
            let hasUserId = ctx.session.authentication.user_id;

            if (authRequired && !hasUserId) {
                // TODO: Migrate this function
                let redirectUrl = pb.RequestHandler.isAdminURL(req.url.pathname) ? '/admin/login' : '/user/login';
                ctx.session.on_login = req.method.toLowerCase() === 'get' ? req.url.href :
                    pb.UrlService.createSystemUrl('/admin', {hostname});
                return ctx.redirect(redirectUrl);
            }
            await next();
        },
        authorizationCheck: async (ctx, next) => {
            let route = ctx.req.route;

            //check if the route requires an admin and if the user is an admin
            if (!hasRightAdminLevel(ctx, route)) {
                return;
            }

            if (!hasCorrectPermission(ctx, route)) {
                return;
            }
            await next();
        },
        ipFilterCheck: async (ctx, next) => {
            if (pb.config.server.ipFilter.enabled && ctx.req.route.path.startsWith('/admin')) {
                const authorized = await util.promisify(pb.AdminIPFilter.requestIsAuthorized).call(pb.AdminIPFilter, ctx.req);
                if (!authorized) {
                    ctx.status = 403;
                    ctx.body = '403 Forbidden';
                    return;
                }
            }
            await next();
        }
    };

    return middleware;
};
