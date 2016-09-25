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
     * Saves the site's email settings
     */
    function Email(){}
    util.inherits(Email, pb.BaseController);

    Email.prototype.render = function(cb) {
        var self = this;

        this.getJSONPostParams(function(err, post) {
            var settingService = pb.SettingServiceFactory.getServiceBySite(self.site, true);
            settingService.set('email_settings', post, function(data) {
                if(util.isError(data)) {
                    cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'), result)
                    });
                    return;
                }

                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.g('site_settings.EMAIL_SETTINGS') + ' ' +  self.ls.g('admin.EDITED'))});
            });
        });
    };

    Email.prototype.getSanitizationRules = function() {
        return {
            verification_content: pb.BaseController.getContentSanitizationRules()
        };
    };

    //exports
    return Email;
};
