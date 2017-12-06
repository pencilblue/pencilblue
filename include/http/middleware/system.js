const path = require('path');
const util = require('util');
const url = require('url');
const HttpStatus = require('http-status-codes');
const ErrorUtils = require('../../error/error_utils');


const publicRoutes = ['/js/', '/css/', '/fonts/', '/img/', '/localization/', '/favicon.ico', '/docs/'];
const modulePattern = /^\/node_modules\/(.*)/

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
        const pathname = req.handler.url.pathname
        if (publicRoutes.some(prefix => pathname.startsWith(prefix))) {
            const absolutePath = path.join(pb.config.docRoot, 'public', pathname)
            req.handler.servePublicContent(absolutePath);
            req.router.continueAfter('writeResponse')
        }
    },
    checkModuleRoute: (req, res) => {
        const pathname = req.handler.url.pathname
        const match = modulePattern.exec(pathname)
        if (match) {
            let modulePath
            try {
                modulePath = require.resolve(match[1])
            } catch(_) {
                throw ErrorUtils.notFound()
            }
            req.handler.servePublicContent(modulePath)
            req.router.continueAfter('writeResponse')
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
