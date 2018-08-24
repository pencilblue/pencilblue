const url = require('url');
const util = require('util');
const _ = require('lodash');
const HttpStatus = require('http-status-codes');
const ErrorUtils = require('../../error/error_utils');

module.exports = pb => ({
    deriveSite: (ctx) => {
        let req = ctx.req;
        let siteObj = ctx.sites[req.hostname]; // TODO: move sites to start on the ctx
        let redirectHost = pb.RequestHandler.redirectHosts[req.hostname]; //TODO: wtf is this? attach it to ctx

        // If we need to redirect to a different host
        if (!siteObj && redirectHost && pb.RequestHandler.sites[redirectHost]) {
            req.url.protocol = pb.config.server.ssl.enabled || pb.config.server.ssl.use_x_forwarded ? 'https' : 'http';
            req.url.host = redirectHost;
            ctx.status = HttpStatus.MOVED_PERMANENTLY;
            ctx.redirect(url.format(req.url));
            ctx.body = `Redirecting to ${redirectHost}`;
            return true;
        }
        req.siteObj = siteObj;

        //make sure we have a site
        if (!siteObj) {
            ctx.status = HttpStatus.NOT_FOUND;
            return true;
        }

        req.site = req.siteObj.uid;
        req.siteName = req.siteObj.displayName;
    },
    deriveActiveTheme: async (ctx) => {
        const settings = pb.SettingServiceFactory.getService(pb.config.settings.use_memory, pb.config.settings.use_cache, ctx.req.siteObj.uid);
        let activeTheme = await util.promisify(settings.get).call(settings, 'active_theme');
        if (!activeTheme) {
            pb.log.warn(`RequestHandler: The active theme is not set.  Defaulting to '${pb.config.plugins.default}'`);
            activeTheme = pb.config.plugins.default;
        }
        ctx.req.activeTheme = activeTheme;
    },
    deriveRoute: (ctx) => { // TODO: Evaluate if we need most of this or not, I think we will need some but not all
        //Get plugins in priority order
        let req = ctx;
        const pluginService = new pb.PluginService({site: req.site});
        const plugins = _.uniq([req.activeTheme, ...pluginService.getActivePluginNames(), pb.config.plugins.default])
            .map(plugin => pb.RequestHandler.storage[plugin])
            .filter(x => !!x);

        const pathname = req.url.pathname;

        let descriptor;
        let pathVars = {};

        const findDescriptor = route => {
            const descriptors = _.get(route, 'descriptors', {});
            return descriptors[req.method] || descriptors['all'];
        };

        let exactMatch = plugins.some(plugin => {
            descriptor = findDescriptor(plugin[pathname]) || findDescriptor(plugin['/:locale?' + pathname]);
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
            throw ErrorUtils.notFound();
        }
        req.route = descriptor;
        req.pathVars = pathVars;
    },
    inactiveAccessCheck: (ctx) => {
        let req = ctx.req;
        let inactiveSiteAccess = req.route.inactive_site_access;
        if (req.siteObj.active || inactiveSiteAccess) {
            return;
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
        return true;
    }
});
