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
 * Saves the site's content settings
 */

function Content(){}

//inheritance
util.inherits(Content, pb.FormController);

Content.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

	post = pb.DocumentCreator.formatIntegerItems(post, ['articles_per_page', 'auto_break_articles', 'display_timestamp', 'two_digit_date', 'display_hours_minutes', 'two_digit_time', 'display_bylines', 'display_author_photo', 'display_author_position', 'allow_comments', 'default_comments', 'require_account', 'require_verification']);
	self.setFormFieldValues(post);

	var message = this.hasRequiredParams(post, ['articles_per_page']);
	if(message) {
        this.formError(message, '/admin/site_settings/content', cb);
        return;
    }

    pb.settings.set('content_settings', post, function(data) {
        if(util.isError(data)) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/site_settings/content', cb);
            return;
        }

        self.session.success = self.ls.get('CONTENT_SETTINGS') + ' ' + self.ls.get('EDITED');
        self.redirect('/admin/site_settings/content', cb);
    });
};

//exports
module.exports = Content;
