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

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;
    var BaseController = pb.BaseController;
    var BaseAdminController = pb.BaseAdminController;

    /**
     * Updates the navigation
     */
    function NavigationMap(){}
    util.inherits(NavigationMap, pb.BaseAdminController);


    NavigationMap.prototype.init = function (props, cb) {
        var self = this;
        var init = function () {
            self.sectionService = new pb.SectionService({site: self.site, onlyThisSite: true});
            cb();
        };
        BaseAdminController.prototype.init.call(self, props, init);
    };

    NavigationMap.prototype.render = function(cb) {
        var self = this;
        var mySettings = pb.SettingServiceFactory.getService(pb.config.settings.use_memory, pb.config.settings.use_cache, self.site, true);
        this.getJSONPostParams(function(err, post) {
            if(util.isError(err)) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
                });
                return;
            }

            var message = self.hasRequiredParams(post, ['map']);
            if(message) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
                });
                return;
            }

            var sectionMap = post.map;
            if(sectionMap.length <= 0 || !sectionMap[0].uid) {
                return cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'))
                });
            }
            self.sectionService.validationSectionMap(sectionMap, function(err, result){
                if(util.isError(err)) {
                    return self.handleError(err, cb);
                }
                else if(util.isArray(result) && result.length > 0) {
                    return self.handleBadRequest(result, cb);
                }
                mySettings.set('section_map', sectionMap, function(err, data) {
                    if(util.isError(err)) {
                        return cb({
                            code: 400,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'))
                        });
                    }

                    cb({
                        code: 200,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.g('generic.NAV_MAP_SAVED'), post)
                    });
                });
            });
            

        });
    };

    /**
     * @method handleError
     * @param {Error} err
     * @param {Function} cb
     */
    NavigationMap.prototype.handleError = function(err, cb) {
        return cb({
            code: 500,
            content: BaseController.apiResponse(BaseController.API_ERROR, this.ls.g('generic.ERROR_SAVING'))
        });
    };


    /**
     * @method handleBadRequest
     * @param {Array} validationErrors
     * @param {Function} cb
     */
    NavigationMap.prototype.handleBadRequest = function(validationErrors, cb) {
        return cb({
            code: 400,
            content: BaseController.apiResponse(BaseController.API_ERROR, NavigationMap.getHtmlErrorMsg(validationErrors))
        });
    };

    /**
     * Formats the errors as a single HTML message
     * @static
     * @method checkForNavMapUpdate
     * @param {Function} cb
     */
    NavigationMap.getHtmlErrorMsg = function(validationErrors) {
        return validationErrors.reduce(function(html, error, i) {
            if (i > 0) {
                html += '<br/>';
            }
            return html + error.field + ': ' + error.message;
        }, '');
    };

    //exports
    return NavigationMap;
};
