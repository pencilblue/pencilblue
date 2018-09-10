
module.exports = pb => ({
    startTime: async (ctx, next) => {
        ctx.req.startTime = (new Date()).getTime();
        await next();
    },

    // Last middleware, does not need to call next.  Could combine with startTime
    endTime: async (ctx) => {
        ctx.req.endTime = (new Date()).getTime();
        if (pb.log.isDebug()) {
            const duration = ctx.req.endTime = ctx.req.startTime;
            const code = ctx.status ? ` CODE=${ctx.status}` : '';
            pb.log.debug(`Response Time: ${duration}ms URL=${ctx.req.url.path}${duration}${code}`);
        }
    }
});
