const util = require('util');
const _ = require('lodash');
module.exports = pb => ({
    instantiateController: async (ctx, next) => {
        const Controller = _.get(ctx.req, 'route.controller');
        ctx.req.controllerInstance = new Controller();
        await next();
    },
    initializeController: async (ctx, next) => {
        const props = pb.RequestHandler.buildControllerContext(ctx);
        await new Promise((resolve, reject) => {
            ctx.req.controllerInstance.init(props, (err) => {
                if (util.isError(err)) {
                    return reject(err)
                }
                resolve()
            });
        });
        await next();
    },
    render: async (ctx, next) => {
        let handler = _.get(ctx.req, 'route.handler', 'render');
        if(!ctx.req.controllerInstance[handler]) {
            throw pb.Errors.internalServerError(`Controller found for route description ${ctx.req.route.path} does not have a handler: ${handler}`);
        }
        let content = await new Promise((resolve, reject) => {
            ctx.req.controllerInstance[handler](result => {
                if (util.isError(result)) {
                    return reject(result);
                }
                resolve(result);
            });
        });

        ctx.type = content.content_type || ctx.type;
        ctx.status = content.code || 200;

        ctx.body = content.content;
        await next();
    },
    writeResponse: async (ctx, next) => { // TODO: Rename Write Headers
        let headers = [];
        if(pb.config.server.x_powered_by) {
            headers.push({'x-powered-by': pb.config.server.x_powered_by});
        }
        headers.push({'Access-Control-Allow-Origin': pb.SiteService.getHostWithProtocol(ctx.hostname)});
        //set any custom headers
        Object.keys(headers)
            .forEach((header) => ctx.res.setHeader(header, headers[header]));

        await next();
    }
});
