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
 * Interface for the site's content settings
 */

function Content(){}

//dependencies
var SiteSettings = require('../site_settings');

//inheritance
util.inherits(Content, pb.BaseController);

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
            title: self.ls.get('ARTICLES')
        },
        {
            href: '#timestamp',
            icon: 'clock-o',
            title: self.ls.get('TIMESTAMP')
        },
        {
            href: '#authors',
            icon: 'user',
            title: self.ls.get('AUTHOR')
        },
        {
            href: '#comments',
            icon: 'comment',
            title: self.ls.get('COMMENTS')
        }
    ];

    pb.content.getSettings(function(err, contentSettings) {
        self.setFormFieldValues(contentSettings);

        var angularData = pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings'], self.ls),
                pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'content'),
                tabs: tabs
            }
        );

        self.setPageName(self.ls.get('CONTENT'));
        self.ts.registerLocal('angular_script', angularData);
        self.ts.load('admin/site_settings/content', function(err, data) {
            var result = '' + data;
            self.checkForFormRefill(result, function(newResult) {
                result = newResult;
                cb({content: result});
            });
        });
    });
};

Content.getSubNavItems = function(key, ls, data) {
	var pills = SiteSettings.getPillNavOptions(ls);
    pills.splice(0, 1);
    pills.unshift(
    {
        name: 'configuration',
        title: ls.get('CONTENT'),
        icon: 'chevron-left',
        href: '/admin/site_settings/configuration'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, Content.getSubNavItems);

//exports
module.exports = Content;
