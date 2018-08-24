
module.exports = pb => ({
    startTime: (ctx) => {
        ctx.req.startTime = (new Date()).getTime();
    },

    endTime: (ctx) => {
        ctx.req.endTime = (new Date()).getTime();
        if (pb.log.isDebug()) {
            const duration = ctx.req.endTime = ctx.req.startTime;
            const code = ctx.req.controllerResult.code ? ` CODE=${ctx.req.controllerResult.code}` : '';
            pb.log.debug(`Response Time: ${duration}ms URL=${ctx.req.url}${duration}${code}`);
        }
    }
});
