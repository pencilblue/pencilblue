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

module.exports = function(pb) {
    
    //pb dependencies
    var util                = pb.util;
    var BaseController      = pb.BaseController;
    var ApiActionController = pb.ApiActionController;
    var UrlService          = pb.UrlService;
    
    /**
     * Controller to properly route and handle remote calls to interact with
     * the UrlService
     * @class UrlApiController
     * @constructor
     */
    function UrlApiController() {
    }
    util.inherits(UrlApiController, ApiActionController);

    //constants
    var ACTIONS = {
        exists: false,
        exists_for: false
    };

    /**
     * Provides the hash of all actions supported by this controller
     */
    UrlApiController.prototype.getActions = function() {
        return ACTIONS;
    };

    /**
     * Validates any path parameters for the specified action.  The callback will
     * provide an array of validation errors. When the array is empty it is safe to
     * assume that validation succeeded.
     */
    UrlApiController.prototype.validatePathParameters = function(action, cb) {
        cb(null, []);
    };

    /**
     * Validates any query parameters for the specified action.  The callback will
     * provide an array of validation errors. When the array is empty it is safe to
     * assume that validation succeeded.
     */
    UrlApiController.prototype.validateQueryParameters = function(action, cb) {

        var errors = [];
        if (action === 'exists_for') {
            if (!pb.validation.validateNonEmptyStr(this.query.id, false)) {
                errors.push("The id parameter must be a valid string");
            }

            if (!pb.validation.validateNonEmptyStr(this.query.type, true)) {
                errors.push("The type parameter is required");
            }
        }

        if (!pb.validation.validateNonEmptyStr(this.query.url, true)) {
            errors.push("The url parameter is required");
        }
        cb(null, errors);
    };

    /**
     * The "exists" action handler.  Calls the UrlService function <i>exists</i> to
     * see whether or not the provided URL path could trigger a controller to be
     * executed.
     * @method exists
     * @param {Function} cb
     */
    UrlApiController.prototype.exists = function(cb) {
        var themes  = UrlService.exists(this.query.url);

        //now build response
        var content = BaseController.apiResponse(BaseController.API_SUCCESS, '', themes);
        cb({content: content});
    };

    /**
     * The "exists_for" action handler.  Calls the UrlService function
     * <i>existsForType</i> to see whether or not the provided URL path the URL key
     * of that particular object type.
     * @method exists_for
     * @param {Function} cb
     */
    UrlApiController.prototype.exists_for = function(cb) {

        var params = {
            type: this.query.type,
            id: this.query.id,
            url: this.query.url
        };
        var service;
        var SITE_FIELD = pb.SiteService.SITE_FIELD;
        if (SITE_FIELD in this.query) {
            service = new UrlService(this.query[SITE_FIELD], true);
        } else {
            service = new UrlService();
        }
        service.existsForType(params, function(err, exists) {
            if (util.isError(err)) {
                var content = BaseController.apiResponse(BaseController.API_FAILURE, err.message);
                cb({content: content, code: 500});
                return;
            }

            //now build response
            var content = BaseController.apiResponse(BaseController.API_SUCCESS, '', exists);
            cb({content: content});
        });
    };

    //exports
    return UrlApiController;
};
