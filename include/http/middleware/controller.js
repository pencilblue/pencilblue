const util = require('util')
const _ = require('lodash')
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
    prefix: (req, res) => {
        if (typeof req.controllerResult.redirect === 'string') {
            // no need to process output
            return false;
        }
        const prefix = req && req.siteObj && req.siteObj.prefix;
        let content = req.controllerResult.content;
        const contentType = req.controllerResult.content_type;

        if (prefix && (contentType === 'text/html' || contentType === undefined) && content && ((typeof content) === 'string')) {
            // Add prefix for all the <a href> & <link href> tags. TO DO: be able to replace <a> href's when href is in a new line
            content = content.replace(/(?<=\<(?:a|link).*\shref\s*=\s*['"])\/[^'"]*['"]/mg, function (match) {
                if (match.indexOf(prefix) !== 0 && match.indexOf(prefix) !== 1) {
                    return `/${prefix}${match}`;
                }
            });

            // Replace all the window.location.href to be window.redirectHref
            content = content.replace(/((?<=[^\$])window)?\.location\.href(?=[\=\s])/g, function (match) {
                return 'window.redirectHref';
            })

            // Inject the global value redirectHref in window
            content = content.replace(/<body[^>]*>/, function (match) {
                return `${match}<script>
                            Object.defineProperty(window, 'redirectHref', {
                                set(val) {
                                    if (/^\\//.test(val)) {
                                        this.location.href = '/${prefix}' + val;
                                    } else {
                                        this.location.href = val;
                                    }
                                },
                                get() {
                                    return this.location.href;
                                }
                            })
                        </script>`;
            });
        }

        // This is to handle the js file. Maybe we could find some better way.
        // if (prefix && data.content_type === 'application/javascript' && Buffer.isBuffer(content)) {
        //     const strContent = new Buffer(content).toString();

        //     // Replace all the window.location.href to be window.redirectHref
        //     content = strContent.replace(/((?<=[^\$])window)?\.location\.href(?=[\=\s])/g, function (match) {
        //         return 'window.redirectHref';
        //     })
        // }


        req.controllerResult.content = content;
    }
})
