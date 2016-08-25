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
    var util         = pb.util;

    /**
     * Saves the site's logo
     * @class SiteLogo
     * @constructor
     */
    function SiteLogo() {}
    util.inherits(SiteLogo, pb.BaseAdminController);

    /**
     * @method render
     * @param {Function} cb
     */
    SiteLogo.prototype.render = function(cb) {
        var self = this;

        var post = this.body;
        if (!pb.validation.validateNonEmptyStr(post.site_logo, true)) {
            return cb({
                code: 500,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.SITE_LOGO_UPLOAD_FAILURE'))
            });
        }

        self.settings.set('site_logo', post.site_logo, function(err, result) {
            if (util.isError(err)) {
                return cb({
                    code: 500,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.SITE_LOGO_UPLOAD_FAILURE'))
                });
            }

            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.g('generic.SITE_LOGO_UPLOAD_SUCCESS'))});
        });
    };

    //exports
    return SiteLogo;
};
