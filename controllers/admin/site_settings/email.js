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
 * Interface for the site's email settings
 */

function Email(){}

//dependencies
var SiteSettings = require('../site_settings');

//inheritance
util.inherits(Email, pb.BaseController);

//statics
var SUB_NAV_KEY = 'site_email_settings';

Email.prototype.render = function(cb) {
    var self = this;

    var tabs =
    [
        {
            active: 'active',
            href: '#preferences',
            icon: 'wrench',
            title: self.ls.get('PREFERENCES')
        },
        {
            href: '#smtp',
            icon: 'upload',
            title: self.ls.get('SMTP')
        },
        {
            href: '#test',
            icon: 'flask',
            title: self.ls.get('TEST')
        }
    ];

    pb.email.getSettings(function(err, emailSettings) {
        self.setFormFieldValues(emailSettings);

        var angularData = pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings'], self.ls),
                pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'email'),
                tabs: tabs
            }
        );

        self.setPageName(self.ls.get('EMAIL'));
        self.ts.registerLocal('angular_script', angularData);
        self.ts.load('admin/site_settings/email', function(err, data) {
            var result = data;
            self.checkForFormRefill(result, function(newResult) {
                result = newResult;
                cb({content: result});
            });
        });
    });
};

Email.getSubNavItems = function(key, ls, data) {
	var pills = SiteSettings.getPillNavOptions(ls);
    pills.splice(1, 1);
    pills.unshift(
    {
        name: 'configuration',
        title: ls.get('EMAIL'),
        icon: 'chevron-left',
        href: '/admin/site_settings/configuration'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, Email.getSubNavItems);

//exports
module.exports = Email;
