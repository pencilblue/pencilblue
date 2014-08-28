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
 * Parent media controller
 * @class ContentMediaController
 * @constructor
 * @extends BaseController
 */
function Media(){}

//inheritance
util.inherits(Media, pb.BaseController);

Media.prototype.render = function(cb) {
	this.redirect('/admin/content/media/manage_media', cb);
};

Media.getPillNavOptions = function(activePill) {
    return [
        {
            name: 'add_media',
            title: '',
            icon: 'plus',
            href: '/admin/content/media/add_media'
        }
    ];
};

/**
 * @deprecated
 * @method getAll
 * @param {Function} cb
 */
Media.getAll = function(cb) {

    var dao  = new pb.DAO();
    dao.query('media', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {name: 1}).then(function(media) {
    	if (util.isError(media)) {
    		//TODO properly handle this error
    		pb.log.warn("Media:getAll Error not properly handled: "+media);
    		media = [];
    	}

        pb.MediaService.formatMedia(media);

        cb(media);
    });
};

//exports
module.exports = Media;
