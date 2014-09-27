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
 * Retrieve articles
 */

/**
 * Returns information on a media link
 */
function GetMediaLink(){}

//inheritance
util.inherits(GetMediaLink, pb.BaseController);

GetMediaLink.prototype.render = function(cb) {
    var self = this;
    var get  = this.query;

    var message = this.hasRequiredParams(get, ['url']);
    if (message) {
        cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
        });
        return;
    }

    if(!self.isValidMediaURL(get.url)) {
        cb({
            code: 400,
            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_URL'))
        });
        return;
    }

    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'Yeah!')});
};

GetMediaLink.prototype.isValidMediaURL = function(url) {
    var regexp = /\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;

    return regexp.test(url);
};

//exports
module.exports = GetMediaLink;
