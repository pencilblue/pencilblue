/*
    Copyright (C) 2015  PencilBlue, LLC

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

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Interface for managing media
     */
    function ManageMedia(){}
    util.inherits(ManageMedia, pb.BaseController);

    //statics
    var SUB_NAV_KEY = 'manage_media';

    ManageMedia.prototype.init = function (props, cb) {
        this.pathSiteUId = pb.SiteService.getCurrentSite(props.path_vars.siteid);
        this.sitePrefix = pb.SiteService.getCurrentSitePrefix(this.pathSiteUId);

        pb.BaseController.prototype.init.call(this, props, cb);
    };

    ManageMedia.prototype.render = function(cb) {
        var self = this;
        var options = {
            select: {
                name: 1,
                caption: 1,
                last_modified: 1,
                media_type: 1,
                location: 1
            },
            where : {site: self.pathSiteUId},
            order: {created: pb.DAO.DESC},
            format_media: true
        };
        var mservice = new pb.MediaService();
        mservice.get(options, function(err, mediaData) {
            if(util.isError(mediaData) || mediaData.length === 0) {
                self.redirect('/admin' + self.sitePrefix + '/content/media/new', cb);
                return;
            }

            self.getAngularObjects(mediaData, function(angularObjects) {
                var title = self.ls.get('MANAGE_MEDIA');
                self.setPageName(title);
                self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
                self.ts.load('admin/content/media/manage_media', function(err, result) {
                    cb({content: result});
                });
            });
        });
    };

    ManageMedia.prototype.getAngularObjects = function(mediaData, cb) {
        var self = this;
        pb.AdminSubnavService.getWithSite(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, {site: self.pathSiteUId}, function(pills) {
            var angularObjects = pb.ClientJs.getAngularObjects(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'media'], self.ls),
                    pills: pills,
                    media: pb.MediaService.formatMedia(mediaData),
                    sitePrefix: self.sitePrefix
                });
            cb(angularObjects);
        });
    };

    ManageMedia.getSubNavItems = function(key, ls, data) {
        var adminPrefix = '/admin'
        if(data.site) {
            adminPrefix += '/' + data.site;
        }
        return [{
            name: 'manage_media',
            title: ls.get('MANAGE_MEDIA'),
            icon: 'refresh',
            href: adminPrefix + '/content/media'
        }, {
            name: 'new_media',
            title: '',
            icon: 'plus',
            href: adminPrefix + '/content/media/new'
        }];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageMedia.getSubNavItems);

    //exports
    return ManageMedia;
};
