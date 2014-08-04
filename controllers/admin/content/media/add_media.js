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
 * Interface for adding media
 */

function AddMedia(){}

//dependencies
var Media = require('../media.js');

//inheritance
util.inherits(AddMedia, pb.BaseController);

//statics
var SUB_NAV_KEY = 'add_media';

AddMedia.prototype.render = function(cb) {
	var self = this;

    var tabs   =
    [
        {
            active: 'active',
            href: '#media_upload',
            icon: 'film',
            title: self.ls.get('LINK_OR_UPLOAD')
        },
        {
            href: '#topics_dnd',
            icon: 'tags',
            title: self.ls.get('TOPICS')
        }
    ];

    var dao = new pb.DAO();
    dao.query('topic', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(topics) {
        var objects = {
            navigation: pb.AdminNavigation.get(self.session, ['content', 'media'], self.ls),
            pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'add_media'),
            tabs: tabs,
            topics: topics
        };
        var angularData = pb.js.getAngularController(objects, [], 'initTopicsPagination()');

        self.setPageName(self.ls.get('ADD_MEDIA'));
        self.ts.registerLocal('angular_script', angularData);
        self.ts.load('admin/content/media/add_media', function(err, data) {
            var result = '' + data;
            cb({content: result});
        });
    });
};

AddMedia.getSubNavItems = function(key, ls, data) {
	var pills = Media.getPillNavOptions();
    pills.unshift(
    {
        name: 'manage_media',
        title: ls.get('ADD_MEDIA'),
        icon: 'chevron-left',
        href: '/admin/content/media/manage_media'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, AddMedia.getSubNavItems);

//exports
module.exports = AddMedia;
