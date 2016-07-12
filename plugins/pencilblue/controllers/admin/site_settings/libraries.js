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
     * Interface for the site's libraries settings
     */
    function Libraries(){}
    util.inherits(Libraries, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'libraries_settings';

    Libraries.prototype.render = function(cb) {
        var self = this;

        var tabs =
        [
            {
                active: 'active',
                href: '#css',
                icon: 'css3',
                title: 'CSS'
            },
            {
                href: '#javascript',
                icon: 'eject fa-rotate-90',
                title: 'JavaScript'
            }
        ];

        var librariesService = new pb.LibrariesService();
        librariesService.getSettings(function(err, librarySettings) {
            var angularObjects = pb.ClientJs.getAngularObjects({
                navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings'], self.ls, self.site),
                pills: self.getAdminPills(SUB_NAV_KEY, self.ls, 'libraries'),
                tabs: tabs,
                librarySettings: librarySettings,
                cdnDefaults: pb.LibrariesService.getCDNDefaults(),
                bowerDefaults: pb.LibrariesService.getBowerDefaults()
            });

            self.setPageName(self.ls.g('site_settings.LIBRARIES'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/site_settings/libraries', function(err, result) {
                cb({content: result});
            });
        });
    };


    Libraries.getSubNavItems = function(key, ls, data) {
        return [{
            name: 'configuration',
            title: ls.g('site_settings.LIBRARIES'),
            icon: 'chevron-left',
            href: '/admin/site_settings'
        }, {
            name: 'content',
            title: ls.g('generic.CONTENT'),
            icon: 'quote-right',
            href: '/admin/site_settings/content'
        }, {
            name: 'email',
            title: ls.g('generic.EMAIL'),
            icon: 'envelope',
            href: '/admin/site_settings/email'
        }];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, Libraries.getSubNavItems);

    //exports
    return Libraries;
};
