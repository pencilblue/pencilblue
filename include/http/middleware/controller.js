const util = require('util')
const _ = require('lodash')
const request = require('request-promise');

module.exports = pb => ({
    instantiateController: (req, res) => {
        const Controller = _.get(req, 'route.controller');
        req.controllerInstance = new Controller();
    },
    initializeController: (req, res) => {
        const props = pb.RequestHandler.buildControllerContext(req, res, {});
        return new Promise((resolve, reject) => {
            req.controllerInstance.init(props, (err) => {
                if (util.isError(err)) {
                    return reject(err)
                }
                resolve()
            })
        })
    },
    render: async (req, res) => {
        let handler = _.get(req, 'route.handler', 'render')
        req.controllerResult = await new Promise((resolve, reject) => {
            req.controllerInstance[handler](result => {
                if (util.isError(result)) {
                    return reject(result)
                }
                resolve(result)
            })
        })
    },
    writeResponse: (req, res) => {
        var data = req.controllerResult;
        req.didRedirect = typeof data.redirect === 'string';
        if (req.didRedirect) {
            req.handler.doRedirect(data.redirect, data.code);
        }
        else {
            req.handler.writeResponse(data);
        }
    },

    async callProxy(req, res) {
        if (req.url.startsWith('proxy') || req.url.startsWith('/proxy')) {
            const proxyDomain = `https://tn-consumer-poc.herokuapp.com`;
            const url = req.url.replace('/proxy', proxyDomain);

            const response = await request({
                url: url,
                method: 'GET',
                headers: {
                    "Accept": '*/*;q=0.5, text/javascript, application/javascript, application/ecmascript, application/x-ecmascript',
                    "Referer": 'http://premium.lvh.me:8080/searchv2',
                    'Origin': 'http://premium.lvh.me:8080',
                    'User-Agent': 'Mozilla/ 5.0(Macintosh; Intel Mac OS X 10_13_6) AppleWebKit / 537.36(KHTML, like Gecko) Chrome / 75.0.3770.90 Safari / 537.36',
                    'DNT': '1',
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
        }
    },

    prefix: (req, res) => {
        if (typeof req.controllerResult.redirect === 'string') {
            // no need to process output
            return false;
        }
        const prefix = req && req.siteObj && req.siteObj.prefix;
        let content = req.controllerResult.content;
        const contentType = req.controllerResult.content_type;

        if (prefix && content && !/^\/admin\//.test(req.url) &&
            (contentType === 'text/html' || contentType === undefined) &&
            ((typeof content) === 'string')) {

            // Add prefix for all the <a href> & <link href> tags. TO DO: be able to replace <a> href's when href is in a new line
            const disableHtmlPrefix = req && req.siteObj && req.siteObj.disableHtmlPrefix;
            if (!disableHtmlPrefix) {
                content = content.replace(/(\<(?:a|link|script|img|image)(?:[^\>]|\r|\n)*\s(?:ng-href|href|src)\s*=\s*['"]\/)([^\/][^'"\>]*)(['"])/mg, function (match, p1, p2, p3) {
                    if (p2.indexOf(prefix) !== 0 && p2.indexOf(prefix) !== 1) {
                        return `${p1}${prefix}/${p2}${p3}`;
                    } else {
                        return `${p1}${p2}${p3}`;
                    }
                });
            }

            // Replace all the window.location.href to be window.redirectHref
            // Need to include $window.location.href, $location.href, and location.href later
            content = content.replace(/((\$?window\.)(?:top.)?)(location\.href)(?=[\=\s])/g, function (match, p1) {
                return '${p1}redirectHref';
            })

            // Inject the global value redirectHref in window
            content = content.replace(/<body[^>]*>/, function (match) {
                return `${match}<script>
                            var reg = new RegExp('^\/(?!${prefix})');

                            Object.defineProperty(window, 'redirectHref', {
                                'set': function (val) {
                                    if (reg.test(val)) {
                                        this.location.href = '/${prefix}' + val;
                                    } else {
                                        this.location.href = val;
                                    }
                                },
                                'get': function () {
                                    return this.location.href;
                                }
                            });

                            jQuery.fn.extend({
                                'attr': function ( name, value ) {
                                    if ((name === 'href' || name === 'src') && reg.test(value)) {
                                        value = '/${prefix}' + value;
                                    }

                                    return jQuery.access( this, jQuery.attr, name, value, arguments.length > 1 );
                            　　},
                                'prop': function ( name, value ) {
                                    if ((name === 'href' || name === 'src') && reg.test(value)) {
                                        value = '/${prefix}' + value;
                                    }

                                    return jQuery.access( this, jQuery.attr, name, value, arguments.length > 1 );
                            　　}
                            });
                        </script>`;
            });
        }

        req.controllerResult.content = content;
    }
})
