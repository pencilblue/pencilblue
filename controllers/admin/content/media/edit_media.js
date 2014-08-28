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
 * Interface for editing media
 */

function EditMedia(){}

//dependencies
var Media = require('../media.js');

//inheritance
util.inherits(EditMedia, pb.BaseController);

//statics
var SUB_NAV_KEY = 'edit_media';

EditMedia.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;

	//make sure an ID was passed
    if(!vars.id) {
        self.redirect('/admin/media/manage_media', cb);
        return;
    }

    var mservice = new pb.MediaService();
    mservice.loadById(vars.id, function(err, media) {
        if (util.isError(err)) {
            return self.reqHandler.serveError(err);
        }
        else if(media === null) {
        	self.reqHandler.serve404();
            return;
        }

        var tabs   =
        [
            {
                active: 'active',
                href: '#media_upload',
                icon: 'film',
                title: self.ls.get('SETTINGS')
            },
            {
                href: '#topics_dnd',
                icon: 'tags',
                title: self.ls.get('TOPICS')
            }
        ];

        var dao = new pb.DAO();
        dao.query('topic', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(topics) {

            var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, null, media);

            var objects = {
                navigation: pb.AdminNavigation.get(self.session, ['content', 'media'], self.ls),
                pills: pills,
                tabs: tabs,
                media: media,
                topics: topics
            };
            var angularData = pb.js.getAngularController(objects);

            self.session.fieldValues = {
                media_topics: util.isArray(media.media_topics) ? media.media_topics.join(',') : []
            };

            self.setPageName(self.ls.get('EDIT') + ' ' + media.name);
            self.ts.registerLocal('angular_script', angularData);
            self.ts.registerLocal('media_id', media._id);
            self.ts.registerLocal('media', new pb.TemplateValue(JSON.stringify(media), false));
            self.ts.load('admin/content/media/edit_media', function(err, data) {
                var result = '' + data;
                self.checkForFormRefill(result, function(newResult) {
                    result = newResult;
                    cb({content: result});
                });
            });
        });
    });
};

EditMedia.getSubNavItems = function(key, ls, data) {
	var pills = Media.getPillNavOptions();
	pills.unshift(
    {
        name: 'manage_media',
        title: ls.get('EDIT') + ' ' + data.name,
        icon: 'chevron-left',
        href: '/admin/content/media/manage_media'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, EditMedia.getSubNavItems);

//exports
module.exports = EditMedia;
