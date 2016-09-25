/*
    Copyright (C) 2016  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
'use strict';

module.exports = function TextApiControllerModule(pb) {

    //PB dependencies
    var util           = pb.util;
    var PluginService  = pb.PluginService;
    var BaseApiController = pb.BaseApiController;

    /**
     * TextApiController - A sample controller to demonstrate how to build an API without the help of a
     * BaseObjectService instance
     * @class TextApiController
     * @extends BaseController
     * @constructor
     */
    function TextApiController(){}
    util.inherits(TextApiController, BaseApiController);

    /**
     * Called from BaseController#init, the function creates an instance of TextService.
     * The initSync is used to initialize the controller synchronously
     * @method initSync
     * @param {object} context See BaseController#init
     */
    TextApiController.prototype.initSync = function(/*context*/) {
        var TextService = PluginService.getService('textService', 'sample', this.site);

        /**
         * @property service
         * @type {TextService}
         */
        this.service = new TextService();
    };

    /**
     * Simple GET end point that retrieves random text
     *
     * @method getRandomText
     * @param {function} cb The callback.  It does not require a an error parameter.
     */
    TextApiController.prototype.getRandomText = function(cb) {
        var resultWrapper = {
            text: this.service.getText()
        };
        this.handleGet(cb)(null, resultWrapper);
    };

    /**
     * Simple GET end point that retrieves the length of the string provided by the
     * path parameter
     *
     * @method getTextLengthByPathParam
     * @param {function} cb The callback.  It does not require a an error parameter.
     */
    TextApiController.prototype.getTextLengthByPathParam = function(cb) {
        var text = decodeURIComponent(this.pathVars.text);
        var resultWrapper = {
            text: text,
            length: text.length
        };
        this.handleGet(cb)(null, resultWrapper);
    };

    /**
     * Simple GET end point that retrieves the length of the string provided by the
     * query parameter
     *
     * @method getTextLengthByQueryParam
     * @param {function} cb The callback.  It does not require a an error parameter.
     */
    TextApiController.prototype.getTextLengthByQueryParam = function(cb) {
        var text = this.query.text;
        var resultWrapper = {
            text: text || null,
            length: util.isNullOrUndefined(text) ? 0 : text.length
        };
        this.handleGet(cb)(null, resultWrapper);
    };

    /**
     * Simple POST end point that retrieves the length of the string provided by the
     * post parameter.  The RequestHandler will attempt to parse the payload based on
     * the allowed MIME types specified by the route.  The content-type header is
     * expected to be passed by the client as part of the incoming request.
     *
     * @method getTextLengthByPostParam
     * @param {function} cb The callback.  It does not require a an error parameter.
     */
    TextApiController.prototype.getTextLengthByPostParam = function(cb) {
        var text = this.body.text;
        var resultWrapper = {
            text: text || null,
            length: util.isNullOrUndefined(text) ? 0 : text.length
        };
        this.handleGet(cb)(null, resultWrapper);
    };

    /**
     * Provides the routes that are to be handled by an instance of this prototype.
     * The route provides a definition of path, permissions, authentication, and
     * expected content type.
     * Method is optional
     * Path is required
     * Permissions are optional
     * Access levels are optional
     * Content type is optional
     * @static
     * @method getRoutes
     * @param {function} cb (Error, Array)
     */
    TextApiController.getRoutes = function(cb) {
        var routes = [
            {
                method: 'get',
                path: "/api/sample/random/text",
                content_type: 'application/json',
                handler: "getRandomText"
            },
            {
                method: 'get',
                path: "/api/sample/text/length/:text",
                content_type: 'application/json',
                handler: "getTextLengthByPathParam"
            },
            {
                method: 'get',
                path: "/api/sample/text/length",
                content_type: 'application/json',
                handler: "getTextLengthByQueryParam"
            },
            {
                method: 'post',
                path: "/api/sample/text/length",
                content_type: 'application/json',
                handler: "getTextLengthByPostParam",
                request_body: ['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data']
            }
        ];
        cb(null, routes);
    };

    //exports
    return TextApiController;
};
