const url = require('url');
const util = require('util');
const _ = require('lodash');
const HttpStatus = require('http-status-codes');
const ErrorUtils = require('../../error/error_utils');

module.exports = pb => ({
    deriveSite: (req, res) => {
        var hostname = req.handler.hostname;
        var siteObj = pb.RequestHandler.sites[hostname];
        var redirectHost = pb.RequestHandler.redirectHosts[hostname];

        // If we need to redirect to a different host
        if (!siteObj && redirectHost && pb.RequestHandler.sites[redirectHost]) {
            req.handler.url.protocol = pb.config.server.ssl.enabled || pb.config.server.ssl.use_x_forwarded ? 'https' : 'http';
            req.handler.url.host = redirectHost;
            return req.router.redirect(url.format(req.handler.url), HttpStatus.MOVED_PERMANENTLY);
        }
        req.handler.siteObj = req.siteObj = siteObj;

        //make sure we have a site
        if (!siteObj) {
            throw ErrorUtils.notFound()
        }

        req.handler.site = req.site = req.handler.siteObj.uid;
        req.handler.siteName = req.siteName = req.handler.siteObj.displayName;
    },
    deriveActiveTheme: async (req, res) => {
        const settings = pb.SettingServiceFactory.getService(pb.config.settings.use_memory, pb.config.settings.use_cache, req.siteObj.uid);
        let activeTheme = await util.promisify(settings.get).call(settings, 'active_theme')
        if (!activeTheme) {
            pb.log.warn("RequestHandler: The active theme is not set.  Defaulting to '%s'", pb.config.plugins.default);
            activeTheme = pb.config.plugins.default;
        }
        req.activeTheme = activeTheme;
    },
    deriveRoute: (req, res) => {
        //Get plugins in priority order
        const pluginService = new pb.PluginService({site: req.site})
        const plugins = _.uniq([req.activeTheme, ...pluginService.getActivePluginNames(), pb.config.plugins.default])
            .map(plugin => pb.RequestHandler.storage[plugin])
            .filter(x => !!x)

        const pathname = req.handler.url.pathname

        let descriptor
        let pathVars = {}

        const findDescriptor = route => {
            const descriptors = _.get(route, 'descriptors', {})
            return descriptors[req.method] || descriptors['ALL']
        }

        let exactMatch = plugins.some(plugin => {
            descriptor = findDescriptor(plugin[pathname]) || findDescriptor(plugin['/:locale?' + pathname])
            return descriptor
        })

        let found = !exactMatch && plugins.some(plugin => {
            return Object.values(plugin).some(route => {
                let match = route.pattern.exec(req.handler.url.pathname)
                // let prefix = req.siteObj.prefix

                // if (prefix) {
                //     let trimedPathName = req.handler.url.pathname.replace(prefix, '').replace('//', '/');
                //     exactMatch = plugins.some(plugin => {
                //         descriptor = findDescriptor(plugin[trimedPathName]) || findDescriptor(plugin['/:locale?' + trimedPathName])
                //         return descriptor
                //     })
                //     if (exactMatch) {
                //         return
                //     }
                //     match = route.pattern.exec(trimedPathName);
                // }

                if (!match) {
                    return false
                }
                pathVars = route.pathVars
                    .map((key, i) => ({
                        [key.name]: match[i + 1]
                    }))
                    .reduce(Object.assign, {})
                descriptor = findDescriptor(route)
                return descriptor
            })
        })
        if (!exactMatch && !found) {
            throw ErrorUtils.notFound();
        }
        req.route = req.handler.route = descriptor
        req.pathVars = pathVars
    },
    inactiveAccessCheck: (req, res) => {
        var inactiveSiteAccess = req.route.inactive_site_access;
        if (req.siteObj.active || inactiveSiteAccess) {
            return
        }
        if (req.siteObj.uid === pb.SiteService.GLOBAL_SITE) {
            return req.router.redirect('/admin')
        }
        if (req.siteObj.useCustomRedirect || pb.config.multisite.forceCustomRedirectForInactive) {
            var redirectLink = req.siteObj.redirectLink || pb.config.multisite.defaultRedirectLink;
            return req.router.redirect(redirectLink)
        }
        throw ErrorUtils.notFound()
    }
})
