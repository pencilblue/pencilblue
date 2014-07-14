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
 * Provides information on media
 *
 * @module Services
 * @submodule Entities
 * @class MediaService
 * @constructor
 */
function MediaService(){}

/**
 * Retrieves whether a media's file path is valid
 *
 * @method isValidFilePath
 * @param {String}   mediaPath The file path of the media
 * @param {Function} cb        Callback function
 */
MediaService.prototype.isValidFilePath = function(mediaPath, cb) {
	var absolutePath = path.join(DOCUMENT_ROOT, 'public', mediaPath);
	fs.exists(absolutePath, function(exists) {
		cb(null, exists);
	});
};

//exports
module.exports = MediaService;
