/*
    Copyright (C) 2016  PencilBlue, LLC

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
'use strict';

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Interface for the site's content settings
     */
    function Content(){}
    util.inherits(Content, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'content_settings';

    Content.prototype.render = function(cb) {
        var self = this;

        var tabs =
        [
            {
                active: 'active',
                href: '#articles',
                icon: 'files-o',
                title: self.ls.g('admin.ARTICLES')
            },
            {
                href: '#timestamp',
                icon: 'clock-o',
                title: self.ls.g('site_settings.TIMESTAMP')
            },
            {
                href: '#authors',
                icon: 'user',
                title: self.ls.g('admin.AUTHOR')
            },
            {
                href: '#comments',
                icon: 'comment',
                title: self.ls.g('generic.COMMENTS')
            }
        ];

        var contentService = new pb.ContentService({site: this.site, onlyThisSite: true});
        contentService.getSettings(function(err, contentSettings) {
            var angularObjects = pb.ClientJs.getAngularObjects({
                navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings'], self.ls, self.site),
                pills: self.getAdminPills(SUB_NAV_KEY, self.ls, 'content', {site:self.site}),
                tabs: tabs,
                contentSettings: contentSettings
            });

            self.setPageName(self.ls.g('generic.CONTENT'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/site_settings/content', function(err,result) {
                cb({content: result});
            });
        });
    };

    Content.getSubNavItems = function(key, ls, data) {

        var subNavItems = [{
            name: 'configuration',
            title: ls.g('generic.CONTENT'),
            icon: 'chevron-left',
            href: '/admin/site_settings'
        }, {
            name: 'email',
            title: ls.g('generic.EMAIL'),
            icon: 'envelope',
            href: '/admin/site_settings/email'
        }];

        if (data.site === pb.SiteService.GLOBAL_SITE) {
            subNavItems.push({
                name: 'libraries',
                title: ls.g('site_settings.LIBRARIES'),
                icon: 'book',
                href: '/admin/site_settings/libraries'
            });
        }

        return subNavItems;
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, Content.getSubNavItems);

    //exports
    return Content;
};
