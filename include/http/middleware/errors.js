const path = require('path');
module.exports = pb => {
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
                ControllerClass = require(path.join(pb.config.docRoot, `/plugins/admin/controllers/error/${code}`))(pb);
            }
        } catch (err) { // Load the default error renderer if we can not get the custom theme one
            ControllerClass = require(path.join(pb.config.docRoot, `/controllers/error_controller`))(pb);
        }

        return ControllerClass;
    }
    async function serveError (ctx, err) {
        ctx.req.error = err;
        // Load the Controller to render the error page
        let ControllerClass = getErrorController(ctx);

        let instance = new ControllerClass();
        await initController(ctx, instance);
        await renderErrorPage(ctx, instance);
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
