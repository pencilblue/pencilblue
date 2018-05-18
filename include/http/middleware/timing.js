
module.exports = pb => ({
    startTime: (req, res) => {
        req.startTime = (new Date()).getTime();
    },

    endTime: (req, res) => {
        req.endTime = (new Date()).getTime();
        if (pb.log.isDebug()) {
            const duration = req.endTime = req.startTime
            const redirect = req.didRedirect ? ` Redirect=${req.controllerResult.redirect}` : ''
            const code = req.controllerResult.code ? ` CODE=${req.controllerResult.code}` : ''
            pb.log.debug(`Response Time: ${duration}ms URL=${req.url}${duration}${code}`)
        }
    }
})
