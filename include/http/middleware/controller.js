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
    }
})
