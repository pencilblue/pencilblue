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
    var util         = pb.util;

    /**
     * Saves the site's logo
     */
    function SiteLogo() {}
    util.inherits(SiteLogo, pb.BaseAdminController);

    SiteLogo.prototype.render = function(cb) {
        var self = this;

        this.getJSONPostParams(function(err, post) {
            if (!pb.validation.validateNonEmptyStr(post.site_logo, true)) {
                cb({
                    code: 500,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('SITE_LOGO_UPLOAD_FAILURE'))
                });
                return;
            }

            self.settings.set('site_logo', post.site_logo, function(err, result) {
                if (util.isError(err)) {
                    cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('SITE_LOGO_UPLOAD_FAILURE'))
                    });
                    return;
                }

                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('SITE_LOGO_UPLOAD_SUCCESS'))});
            });
        });
    };

    //exports
    return SiteLogo;
};
