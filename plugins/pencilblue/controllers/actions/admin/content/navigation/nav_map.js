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
    var util = pb.util;
    
    /**
     * Updates the navigation
     */
    function NavigationMap(){}
    util.inherits(NavigationMap, pb.BaseController);

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
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('ERROR_SAVING'))
                });
                return;
            }

            mySettings.set('section_map', sectionMap, function(err, data) {
                if(util.isError(err)) {
                    cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('ERROR_SAVING'))
                    });
                    return;
                }

                cb({
                    code: 200,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('NAV_MAP_SAVED'), post)
                });
            });
        });
    };

    //exports
    return NavigationMap;
};
