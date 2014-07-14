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
 * Retrieve a media embed
 */

function GetMediaEmbed(){}

//dependencies
var Media = require('../../../include/theme/media');

//inheritance
util.inherits(GetMediaEmbed, pb.FormController);

GetMediaEmbed.prototype.render = function(cb) {
    var self = this;
    var get = this.query;

    var message = this.hasRequiredParams(get, ['id']);
    if(message) {
        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'id is missing from URL')});
        return;
    }

    try {
        ObjectID(get.id);
    }
    catch(error) {
        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'invalid media ID')});
        return;
    }

    var dao = new pb.DAO();
    dao.loadById(get.id, 'media', function(err, mediaObject) {
        if(!mediaObject) {
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'invalid media ID')});
            return;
        }

        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, mediaObject.name + ' retrieved', Media.getMediaEmbed(mediaObject))});
        return;
    });
};

//exports
module.exports = GetMediaEmbed;
