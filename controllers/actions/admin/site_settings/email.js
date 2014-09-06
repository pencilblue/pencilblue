/*
    Copyright (C) 2014  PencilBlue, LLC

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

/**
 * Saves the site's email settings
 */

//dependencies
var BaseController = pb.BaseController;

function Email(){}

//inheritance
util.inherits(Email, pb.FormController);

Email.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

	delete post.layout_link_url;
    delete post.media_max_height;

    post = pb.DocumentCreator.formatIntegerItems(post, ['secure_connection', 'port']);
    self.setFormFieldValues(post);

    pb.settings.set('email_settings', post, function(data) {
        if(util.isError(data)) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/site_settings/content', cb);
            return;
        }

        self.session.success = self.ls.get('EMAIL_SETTINGS') + ' ' +  self.ls.get('EDITED');
        self.redirect('/admin/site_settings/email', cb);
    });
};

Email.prototype.getSanitizationRules = function() {
	return {
		verification_content: BaseController.getContentSanitizationRules()
	};
};

//exports
module.exports = Email;
