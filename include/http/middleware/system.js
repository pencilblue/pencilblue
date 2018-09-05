const path = require('path');
const util = require('util');
const url = require('url');
const readFile = util.promisify(require('fs').readFile);

const publicRoutes = ['/js/', '/css/', '/fonts/', '/img/', '/localization/', '/favicon.ico', '/docs/'];
const modulePattern = /^\/node_modules\/(.*)/

async function servePublicContent(ctx, path) {
    let content = {};
    try {
        content = await readFile(path);
    } catch (err) {
        ctx.status = 404;
    }

    ctx.body = content;
}
module.exports = pb => ({
    parseUrl: async (ctx, next) => {
        ctx.req.hostname = ctx.req.headers.host;
        ctx.req.url = url.parse(ctx.req.url);
        await next();
    },
    checkPublicRoute: async (ctx, next) => {
        let req = ctx.req;
        const pathname = req.url.pathname;
        if (publicRoutes.some(prefix => pathname.startsWith(prefix))) {
            return servePublicContent(ctx, path.join(pb.config.docRoot, 'public', pathname));
        }
        await next();
    },
    checkModuleRoute: async (ctx, next) => { // WTF why is this a thing?
        let req = ctx.req;
        const pathname = req.url.pathname;
        const match = modulePattern.exec(pathname);
        if (match) {
            let modulePath = '';
            try {
                modulePath = require.resolve(match[1])
            } catch(_) {
                ctx.status = 404;
                return;
            }
            return servePublicContent(ctx, modulePath);
        }
        await next();
    },
    systemSetupCheck: async (ctx, next) => {
        let req = ctx.req;
        let route = req.route; // TODO: Figure out what this should be, probably routeDescriptor

        if (!req.route.setup_required) { // TODO: fix this
             return next();
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
            return;
        }
        await next();
    },
    setMimeType: async (ctx, next) => {
        if(ctx.req.url.pathname.includes('.css')) {
            ctx.type = 'text/css';
        }
        await next();
    }
});
