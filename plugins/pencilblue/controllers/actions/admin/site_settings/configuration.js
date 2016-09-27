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

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Saves the site's setting to call home
     */
    function ConfigurationSettingsPostController(){}
    util.inherits(ConfigurationSettingsPostController, pb.BaseController);

    ConfigurationSettingsPostController.prototype.render = function(cb) {
        var self = this;

        this.getJSONPostParams(function(err, post) {
            var message = self.hasRequiredParams(post, ['call_home']);
            if (message) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
                });
                return;
            }

            pb.settings.set('call_home', post.call_home, function(data) {
                if(util.isError(data)) {
                    cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'), data)
                    });
                    return;
                }

                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.g('generic.CONFIGURATION_SETTINGS') + ' ' +  self.ls.g('admin.EDITED'))});
            });
        });
    };

    //exports
    return ConfigurationSettingsPostController;
};
