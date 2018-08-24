const path = require('path');
const util = require('util');
const url = require('url');
const readFile = util.promisify(require('fs').readFile);

const publicRoutes = ['/js/', '/css/', '/fonts/', '/img/', '/localization/', '/favicon.ico', '/docs/'];
const modulePattern = /^\/node_modules\/(.*)/

async function servePublicContent(ctx, path) {
    let content = '';
    try {
        content = await readFile(path);
    } catch (err) {
        ctx.body = {};
        ctx.status = 404;
        return true;
    }

    ctx.body = content;
    return true;
}
module.exports = pb => ({
    /**
     * Parses the incoming URL
     * @method urlParse
     */
    urlParse: (ctx) => {
        let req = ctx.req;
        req.url = url.parse(req.url, true);
        req.hostname = req.headers.host || pb.SiteService.getGlobalSiteContext().hostname;
    },
    checkPublicRoute: async (ctx) => {
        let req = ctx.req;
        const pathname = req.url.pathname;
        if (publicRoutes.some(prefix => pathname.startsWith(prefix))) {
            return servePublicContent(path.join(pb.config.docRoot, 'public', pathname));
        }
    },
    checkModuleRoute: (ctx) => { // WTF why is this a thing?
        let req = ctx.req;
        const pathname = req.url.pathname;
        const match = modulePattern.exec(pathname);
        if (match) {
            let modulePath = '';
            try {
                modulePath = require.resolve(match[1])
            } catch(_) {
                ctx.status = 404;
                return true;
            }
            return servePublicContent(modulePath);
        }
    },
    systemSetupCheck: async (ctx) => {
        let req = ctx.req;
        let route = req.route; /// determine if this is true or not

        if (!req.route.setup_required) {
            return;
        }
        let isSetup = false;
        try {
            isSetup = await pb.settings.getAsync('system_initialized');
            if(!isSetup) {
                throw new Error('Not Setup');
            }
        } catch (err) {
            ctx.status = 301;
            ctx.redirect('/setup');
            ctx.body = 'Redirecting to setup';
            return true;
        }
    }
});
