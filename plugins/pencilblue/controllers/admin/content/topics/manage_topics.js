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
     * Interface for managing topics
     */
    function ManageTopics() {}
    util.inherits(ManageTopics, pb.BaseAdminController);

    var SUB_NAV_KEY = 'manage_topics';

    ManageTopics.prototype.render = function(cb) {
        var self = this;

        var angularObjects = pb.ClientJs.getAngularObjects({
            navigation: pb.AdminNavigation.get(self.session, ['content', 'topics'], self.ls, self.site),
            pills: self.getAdminPills(SUB_NAV_KEY, self.ls, SUB_NAV_KEY)
        });

        self.setPageName(self.ls.g('topics.MANAGE_TOPICS'));
        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
        self.ts.load('admin/content/topics/manage_topics', function(err, data) {
            var result = '' + data;
            cb({content: result});
        });
    };

    ManageTopics.getSubNavItems = function(key, ls, data) {
        return [{
            name: SUB_NAV_KEY,
            title: ls.g('topics.MANAGE_TOPICS'),
            icon: 'refresh',
            href: '/admin/content/topics'
        }, {
            name: 'import_topics',
            title: '',
            icon: 'upload',
            href: '/admin/content/topics/import'
        }, {
            name: 'new_topic',
            title: '',
            icon: 'plus',
            href: '/admin/content/topics/new'
        }];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageTopics.getSubNavItems);

    //exports
    return ManageTopics;
};
