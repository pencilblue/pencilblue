const path = require('path');
module.exports = pb => {
    async function serveError (ctx, err) {
        ctx.req.error = err || {};
        let code = err.code || 500;
        // Load the Controller to render the error page
        let ControllerClass = null;
        try {
            try {
                let activeTheme = ctx.req.activeTheme;
                ControllerClass = require(path.join(pb.config.docRoot, `/plugins/${activeTheme}/controllers/errors/${code}`));
            } catch (err) {
                ControllerClass = require(path.join(pb.config.docRoot, `/plugins/kronos/controllers/errors/${code}`));
            }
        } catch (err) { // Load the default error renderer if we can not get the custom theme one
            ControllerClass = require(path.join(pb.config.docRoot, `/controllers/error_controller`));
        }
        let instance = new ControllerClass();
        await instance.init(ctx);
        ctx.body = await instance.render();
    }
    return {
        errorHandler: async (ctx, next) => {
            try {
                await next();
            } catch (err) {
                err = err || {};
                err.code = err.code || 500;

                pb.log.error(err);

                if(ctx.isActionRoute) {
                    ctx.body = err.message;
                    return ctx.code = err.code;
                }
                await serveError(err, err.code);
            }
        }
    };
};
