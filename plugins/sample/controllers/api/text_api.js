/*
    Copyright (C) 2015  PencilBlue, LLC

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

module.exports = function TextApiControllerModule(pb) {

    //PB dependencies
    var util           = pb.util;
    var PluginService  = pb.PluginService;

    /**
     * TextApiController - A sample controller to demonstrate how to build an API
     * 
     * @author Brian Hyder <brian@pencilblue.org>
     * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
     * @return
     */
    function TextApiController(){}
    util.inherits(TextApiController, pb.BaseController);

    /**
     * Simple GET end point that retrieves random text
     * 
     * @method getRandomText
     * @param cb The callback.  It does not require a an error parameter.  
     */
    TextApiController.prototype.getRandomText = function(cb) {
        var self = this;

        var TextService = PluginService.getService('textService', 'sample', self.site);
        var service = new TextService();
        var text = service.getText();
        var dataStr = pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, '', text);
        var content = {
            content: dataStr
        };
        cb(content);
    };

    /**
     * Simple GET end point that retrieves the length of the string provided by the 
     * path parameter
     * 
     * @method getTextLengthByPathParam
     * @param cb The callback.  It does not require a an error parameter.
     */
    TextApiController.prototype.getTextLengthByPathParam = function(cb) {
        var self = this;

        var text = this.pathVars.text;
        var dataStr = pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, '', text.length);
        var content = {
            content: dataStr
        };
        cb(content);
    };

    /**
     * Simple GET end point that retrieves the length of the string provided by the 
     * query parameter
     * 
     * @method getTextLengthByQueryParam
     * @param cb The callback.  It does not require a an error parameter.
     */
    TextApiController.prototype.getTextLengthByQueryParam = function(cb) {
        var self = this;

        var dataStr;
        var text = this.query.text;
        if (!text) {
            dataStr = pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, '', null);
        }
        else {
            dataStr = pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, '', text.length);
        }

        var content = {
            content: dataStr
        };
        cb(content);
    };

    /*
     * Simple POST end point that retrieves the length of the string provided by the 
     * post parameter.  The RequestHandler will attempt to parse the payload based on 
     * the allowed MIME types specified by the route.  The content-type header is 
     * expected to be passed by the client as part of the incoming request.
     * 
     * @method getTextLengthByPostParam
     * @param cb The callback.  It does not require a an error parameter.
     */
    TextApiController.prototype.getTextLengthByPostParam = function(cb) {
        var self = this;

        var dataStr;
        var text = this.body.text;
        if (!text) {
            dataStr = pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, '', null);
        }
        else {
            dataStr = pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, '', text.length);
        }

        var content = {
            content: dataStr
        };
        cb(content);
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
     * 
     * @param cb A callback of the form: cb(error, array of objects)
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