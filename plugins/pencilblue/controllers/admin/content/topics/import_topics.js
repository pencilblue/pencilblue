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
     * Interface for importing topics from CSV
     */
    function ImportTopics(){}
    util.inherits(ImportTopics, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'import_topics';

    ImportTopics.prototype.render = function(cb) {
        var self = this;

        var tabs   =
        [
            {
                active: 'active',
                href: '#topic_settings',
                icon: 'file-text-o',
                title: self.ls.get('LOAD_FILE')
            }
        ];

        var angularObjects = pb.ClientJs.getAngularObjects(
        {
            navigation: pb.AdminNavigation.get(self.session, ['content', 'topics'], self.ls, self.site),
            pills: self.getAdminPills(SUB_NAV_KEY, self.ls, 'manage_topics'),
            tabs: tabs
        });

        this.setPageName(this.ls.get('IMPORT_TOPICS'));
        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
        this.ts.load('admin/content/topics/import_topics', function(err, result) {
            cb({content: result});
        });
    };

    ImportTopics.getSubNavItems = function(key, ls, data) {
        return [{
            name: 'manage_topics',
            title: ls.get('IMPORT_TOPICS'),
            icon: 'chevron-left',
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
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ImportTopics.getSubNavItems);

    //exports
    return ImportTopics;
};
