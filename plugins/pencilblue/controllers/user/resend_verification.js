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

module.exports = function ResendVerificationModule(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Interface for resending a verification email
     */
    function ResendVerification(){}
    util.inherits(ResendVerification, pb.BaseController);

    ResendVerification.prototype.render = function(cb) {
        var self = this;

        var contentService = new pb.ContentService(self.site, true);
        contentService.getSettings(function(err, contentSettings) {

            if(!contentSettings.allow_comments || !contentSettings.require_verification) {
                self.redirect('/', cb);
                return;
            }

            self.setPageName(self.ls.get('RESEND_VERIFICATION'));
            self.ts.load('user/resend_verification', function(err, data) {
                cb({content: data});
            });
        });
    };

    //exports
    return ResendVerification;
};
