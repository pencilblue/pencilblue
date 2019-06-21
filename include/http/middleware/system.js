const path = require('path');
const util = require('util');
const url = require('url');
const HttpStatus = require('http-status-codes');
const ErrorUtils = require('../../error/error_utils');
const request = require('request-promise');

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
        const siteObj = pb.RequestHandler.sites[req.handler.hostname];

        if (siteObj && siteObj.prefix) {
            req.url = req.url.replace(new RegExp(`^\/${siteObj.prefix}\/?`), '/');
            req.handler.url = url.parse(req.url, true);
        }
    },

    async callProxy(req, res) {
        if (req.url.startsWith('proxy') || req.url.startsWith('/proxy')) {
            const proxyDomain = `https://tn-consumer-poc.herokuapp.com`;
            const url = req.url.replace('/proxy', proxyDomain);

            try {
                const response = await request({
                    url: url,
                    method: 'GET',
                    headers: {
                        "Accept": req.headers.accept,
                        "User-Agent": req.headers['user-agent']
                    },
                    resolveWithFullResponse: true
                });

                let conetnt = response.body;
                const contentType = response.headers['content-type'];

                // if (contentType.includes('javascript')) {
                //     conetnt = conetnt.replace(/(\$\.ajax[\s\S]*url[^\/]*)(\/)/, function (match, p1, p2) {
                //         return `${p1}/proxy/`;
                //     })
                // }

                if (contentType.includes('javascript')) {
                    conetnt = conetnt.replace(`url: host + '/jobs.js'`, function (match, p1, p2) {
                        return `url: '/proxy/jobs.js'`;
                    })
                }

                conetnt = conetnt.replace(/(<[link].*[href\src]\=['|"])(\/)/g, function (match, p1, p2) {
                    return `${p1}/proxy/`;
                });
                conetnt = conetnt.replace(/(<[script|a].*[href\src]\=['|"])(\/)/g, function (match, p1, p2) {
                    return `${p1}/proxy/`;
                });

                req.handler.writeResponse({
                    content: conetnt, content_type: contentType
                });

                req.router.continueAfter('writeResponse');
            } catch (ex) {
                console.log(ex);
            }
        }
    },

    checkPublicRoute: async (req, res) => {
        let pathname = req.handler.url.pathname;

        // This is to hack the public files
        // const sitePrefix = req && req.siteObj && req.siteObj.prefix;
        // if (sitePrefix) {
        //     pathname = pathname.replace(new RegExp(`^\/${sitePrefix}`), '');
        // }

        if (pathname && publicRoutes.some(prefix => pathname.startsWith(prefix))) {
            const absolutePath = path.join(pb.config.docRoot, 'public', pathname);
            await req.handler.servePublicContentAsync(absolutePath);
            req.router.continueAfter('writeResponse');
        }
    },
    checkModuleRoute: async (req, res) => {
        let pathname = req.handler.url.pathname;
        // const prefix = req && req.siteObj && req.siteObj.prefix;
        // if (prefix) {
        //     pathname = pathname.replace(new RegExp(`^\/${prefix}`), '');
        // }
        const match = modulePattern.exec(pathname);
        if (match) {
            let modulePath;
            try {
                modulePath = require.resolve(match[1])
            } catch (_) {
                throw ErrorUtils.notFound()
            }
            await req.handler.servePublicContentAsync(modulePath);
            req.router.continueAfter('writeResponse');
        }
    },
    systemSetupCheck: async (req, res) => {
        const context = {
            route: req.route
        };
        const result = await util.promisify(req.handler.checkSystemSetup).call(req.handler, context);
        if (!result.success) {
            return req.router.redirect(result.redirect);
        }
    },
    parseRequestBody: async (req, res) => {
        let parseBody = util.promisify(req.handler.parseBody).bind(req.handler);
        try {
            req.body = await parseBody(req.route.request_body)
        } catch (err) {
            err.code = HttpStatus.BAD_REQUEST;
            throw err
        }
    }
});
