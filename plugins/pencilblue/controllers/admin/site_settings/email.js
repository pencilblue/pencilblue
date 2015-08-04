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
    var SiteService = pb.SiteService;
    
    /**
     * Interface for the site's email settings
     */
    function Email(){}
    util.inherits(Email, pb.BaseAdminController);

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

        var emailService = new pb.EmailService({site: this.site});
        emailService.getSettings(function(err, emailSettings) {
            var angularObjects = pb.ClientJs.getAngularObjects({
                navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings'], self.ls, self.site),
                pills: self.getAdminPills(SUB_NAV_KEY, self.ls, 'email', { site: self.site }),
                tabs: tabs,
                emailSettings: emailSettings
            });

            self.setPageName(self.ls.get('EMAIL'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/site_settings/email', function(err, result) {
                cb({content: result});
            });
        });
    };

    Email.getSubNavItems = function(key, ls, data) {

        var pills = [{
            name: 'configuration',
            title: ls.get('EMAIL'),
            icon: 'chevron-left',
            href: '/admin/site_settings'
        }, {
            name: 'content',
            title: ls.get('CONTENT'),
            icon: 'quote-right',
            href: '/admin/site_settings/content'
        }];

        if(data && data.site === SiteService.GLOBAL_SITE) {
            pills.push({
                name: 'libraries',
                title: ls.get('LIBRARIES'),
                icon: 'book',
                href: '/admin/site_settings/libraries'
            });
        }

        return pills;
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, Email.getSubNavItems);

    //exports
    return Email;
};
