const util = require('util');
const url = require('url');
const HttpStatus = require('http-status-codes');

module.exports = pb => ({
    /**
     * Parses the incoming URL
     * @method urlParse
     */
    urlParse: (req, res) => {
        req.handler.url = url.parse(req.url, true);
        req.handler.hostname = req.headers.host || pb.SiteService.getGlobalSiteContext().hostname;
    },
    checkPublicRoute: (req, res) => {
        if (pb.RequestHandler.isPublicRoute(req.handler.url.pathname)) {
            req.handler.servePublicContent();
            req.router.continueAfter('writeResponse');
        }
    },
    systemSetupCheck: async (req, res) => {
        const context = {
            route: req.route
        };
        const result = await util.promisify(req.handler.checkSystemSetup).call(req.handler, context)
        if (!result.success) {
            return req.router.redirect(result.redirect)
        }
    },
    parseRequestBody: async (req, res) => {
        let parseBody = util.promisify(req.handler.parseBody).bind(req.handler)
        try {
            req.body = await parseBody(req.route.request_body)
        } catch (err) {
            err.code = HttpStatus.BAD_REQUEST;
            throw err
        }
    }
})
