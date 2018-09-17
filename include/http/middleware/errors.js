const path = require('path');
module.exports = pb => {

    function initializeLocalization (ctx) {
        let opts = {};
        let routeLocale = ctx.params.locale || '';
        let localeSources = [];
        const isLocale = /^[a-z]{2}-([A-Z]{2,3}|(419))$/i; // Regex to match a locale en-US for sv-SE etc
        if (isLocale.test(routeLocale)) {
            localeSources.push(routeLocale);
        }
        localeSources.push(ctx.session.locale);
        localeSources = localeSources.concat(ctx.acceptsLanguages());

        if (ctx.req.siteObj) {
            opts.supported = Object.keys(ctx.req.siteObj.supportedLocales);
            opts.site = ctx.req.site;
            localeSources.push(ctx.req.siteObj.defaultLocale);
        }
        let localePrefStr = localeSources
            .reduce((prev, curr, i) => prev + (curr ? (!!i && !!prev ? ',' : '') + curr : ''), '');

        opts.activeTheme = ctx.req.activeTheme;
        ctx.req.localizationService = new pb.Localization(localePrefStr, opts);
    }
    async function initController(ctx, instance) {
        let props = pb.RequestHandler.buildControllerContext(ctx);
        props.error = ctx.req.error;
        return new Promise((resolve, reject) => {
            instance.init(props, (err) => {
                if (pb.util.isError(err)) {
                    return reject(err);
                }
                resolve();
            });
        });
    }
    async function renderErrorPage (ctx, instance) {
        let content = await new Promise((resolve, reject) => {
            instance.render(result => {
                if (pb.util.isError(result)) {
                    return reject(result);
                }
                resolve(result);
            });
        });

        ctx.type = content.content_type || ctx.type;
        ctx.status = content.code || 200;
        ctx.body = content.content;
    }
    function getErrorController(ctx){
        let code = ctx.req.error.code;
        let ControllerClass = null;
        try {
            try {
                let activeTheme = ctx.req.activeTheme;
                ControllerClass = require(path.join(pb.config.plugins.directory, `/${activeTheme}/controllers/error/${code}`))(pb);
            } catch (err) {
                ControllerClass = require(path.join(pb.config.docRoot, `/plugins/pencilblue/controllers/error/${code}`))(pb);
            }
        } catch (err) { // Load the default error renderer if we can not get the custom theme one
            ControllerClass = require(path.join(pb.config.docRoot, `/controllers/error_controller`))(pb);
        }

        return ControllerClass;
    }
    async function serveError (ctx, err) {
        ctx.req.error = err;
        ctx.req.activeTheme = ctx.req.activeTheme || 'pencilblue';
        initializeLocalization(ctx);
        // Load the Controller to render the error page
        let ControllerClass = getErrorController(ctx);

        try {
            let instance = new ControllerClass();
            await initController(ctx, instance);
            await renderErrorPage(ctx, instance);
        } catch (criticalError) { // if we error-ed while rendering the error page, just serve that error.
            if(err.code >= 500) { // Log original error if it is a 5xx
                pb.log.error(err);
            }
            ctx.status = criticalError.code || 500;
            ctx.body = criticalError.stack;
        }
    }
    return {
        errorHandler: async (ctx, next) => {
            try {
                await next();

                if (ctx.status === 404) {
                    throw pb.Errors.notFound();
                }
            } catch (err) {
                err = err || {};
                err.code = err.code || 500;

                if(err.code >= 500) {
                    pb.log.error(err); // We do not want to log 4xx errors
                }

                if (err.code === 301 || err.code === 302) {
                    ctx.status = err.code;
                    ctx.redirect(err.message);
                    return ctx.body = `redirecting to ${err.message}`;
                }
                else if(ctx.isActionRoute) {
                    ctx.body = err.message;
                    return ctx.code = err.code;
                }
                await serveError(ctx, err);
            }
        }
    };
};
