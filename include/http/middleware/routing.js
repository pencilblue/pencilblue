const url = require('url');
const util = require('util');
const _ = require('lodash');
const HttpStatus = require('http-status-codes');

module.exports = pb => ({
    deriveSite: async (ctx, next) => {
        let req = ctx.req;
        let siteObj = pb.SiteService.getSiteObjectByHostname(req.hostname);
        let redirectHost = pb.SiteService.redirectHosts[req.hostname];

        // If we need to redirect to a different host
        if (!siteObj && redirectHost && pb.SiteService.sites[redirectHost]) {
            // TODO: clean this up a bit
            req.url.protocol = pb.config.server.ssl.enabled || pb.config.server.ssl.use_x_forwarded ? 'https' : 'http';
            req.url.host = redirectHost;
            ctx.status = HttpStatus.MOVED_PERMANENTLY;
            ctx.redirect(url.format(req.url));
            return ctx.body = `Redirecting to ${redirectHost}`;
        }
        req.siteObj = siteObj;

        //make sure we have a site
        if (!siteObj) {
            return ctx.status = HttpStatus.NOT_FOUND;
        }

        req.site = req.siteObj.uid;
        req.siteName = req.siteObj.displayName;
        await next();
    },
    deriveActiveTheme: async (ctx, next) => {
        const settings = pb.SettingServiceFactory.getService(pb.config.settings.use_memory, pb.config.settings.use_cache, ctx.req.siteObj.uid);
        let activeTheme = await util.promisify(settings.get).call(settings, 'active_theme');
        if (!activeTheme) {
            pb.log.warn(`RequestHandler: The active theme is not set.  Defaulting to '${pb.config.plugins.default}'`);
            activeTheme = pb.config.plugins.default;
        }
        ctx.req.activeTheme = activeTheme;
        await next();
    },
    deriveRoute: async (ctx, next) => { // TODO: Evaluate if we need most of this or not, I think we will need some but not all
        //Get plugins in priority order
        let req = ctx.req;
        const pluginService = new pb.PluginService({site: req.site});
        const plugins = _.uniq([req.activeTheme, ...pluginService.getActivePluginNames(), pb.config.plugins.default])
            .map(plugin => pb.RouterLoader.storage[plugin]) // TODO: move storage off request handler
            .filter(x => !!x);

        const pathname = req.url.pathname;

        let descriptor = {};
        let pathVars = {};

        const findDescriptor = route => {
            const descriptors = _.get(route, 'descriptors', {});
            return descriptors[req.method.toLowerCase()] || descriptors['all'];
        };

        let exactMatch = plugins.some(plugin => {
            descriptor = findDescriptor(plugin[pathname]);
            if(!descriptor) {
                descriptor = findDescriptor(plugin['/:locale?' + pathname]);
                if(descriptor) {
                    delete ctx.params.locale;
                }
            }
            return descriptor;
        });

        let found = !exactMatch && plugins.some(plugin => {
            return Object.values(plugin).some(route => {
                let match = route.pattern.exec(req.url.pathname);
                if (!match) {
                    return false
                }
                pathVars = route.pathVars
                    .map((key, i) => ({
                        [key.name]: match[i + 1]
                    }))
                    .reduce(Object.assign, {});
                descriptor = findDescriptor(route);
                return descriptor
            })
        })
        if (!exactMatch && !found) {
            return ctx.status = 404;
        }
        req.route = descriptor;
        req.pathVars = pathVars;
        await next();
    },
    inactiveAccessCheck: async (ctx, next) => {
        let req = ctx.req;
        let inactiveSiteAccess = req.route.inactive_site_access;
        if (req.siteObj.active || inactiveSiteAccess) {
            return next();
        }
        if (req.siteObj.uid === pb.SiteService.GLOBAL_SITE) {
            ctx.status = 301;
            ctx.redirect('/admin');
            ctx.body = 'redirecting to admin panel';
        }
        else if (req.siteObj.useCustomRedirect || pb.config.multisite.forceCustomRedirectForInactive) {
            let redirectLink = req.siteObj.redirectLink || pb.config.multisite.defaultRedirectLink;
            ctx.redirect(redirectLink);
        }
        else {
            ctx.status = 404;
        }
    }
});
