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
 * Adds new media from inside a non-media form
 */

function InlineAddMedia(){}

//dependencies
var AddMedia = require('./add_media.js');

//inheritance
util.inherits(InlineAddMedia, AddMedia);

InlineAddMedia.prototype.onSaveSuccessful = function(mediaDocument, cb) {
	cb({content: JSON.stringify(mediaDocument)});
};

InlineAddMedia.prototype.getRequiredParams = function() {
	return ['media_type', 'location'];
};

InlineAddMedia.prototype.getFormErrorRedirect = function(){
	return '/admin/content/media/manage_media';
};

InlineAddMedia.prototype.genReturnVal = function(result) {
	return {
		content: JSON.stringify(result),
		content_type: 'application/json'
	};
};

//exports
module.exports = InlineAddMedia;
