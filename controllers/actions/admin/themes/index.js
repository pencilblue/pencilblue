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
* Saves the site's theme settings
*/

function ThemesPostController() {}

//dependencies
var FormController = pb.FormController;
var MediaService   = pb.MediaService;

//inheritance
util.inherits(ThemesPostController, FormController);

//constants
var REDIRECT_URL = '/admin/themes';


ThemesPostController.prototype.onPostParamsRetrieved = function(post, cb) {
	self = this;

	//check file
	var mediaService = new MediaService();
	var getVal = function(post, callback) {
		if (pb.validation.validateUrl(post.image_url, true)) {
			callback(null, post.image_url);
		}
		else {
			mediaService.isValidFilePath(post.uploaded_image, function(err, valid) {
				callback(err, valid ? post.uploaded_image : null);
			});
		}
	};
	getVal(post, function(err, val) {
		if (!pb.validation.validateNonEmptyStr(val, true)) {
			self.session.error = self.ls.get('SITE_LOGO_UPLOAD_FAILURE');
			self.redirect(REDIRECT_URL, cb);
			return;
		}

		pb.settings.set('site_logo', val, function(err, result) {
			if (util.isError(err)) {
				throw err;
			}

			self.session.success = self.ls.get('SITE_LOGO_UPLOAD_SUCCESS');
			self.redirect(REDIRECT_URL, cb);
		});
	});
};

//exports
module.exports = ThemesPostController;
