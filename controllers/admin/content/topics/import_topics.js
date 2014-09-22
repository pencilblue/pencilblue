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
 * Interface for importing topics from CSV
 */

function ImportTopics(){}

//var dependencies
var Topics = require('../topics');

//inheritance
util.inherits(ImportTopics, pb.BaseController);

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

    var angularData = pb.js.getAngularController(
    {
        navigation: pb.AdminNavigation.get(self.session, ['content', 'topics'], self.ls),
        pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'manage_topics'),
        tabs: tabs
    });

	this.setPageName(this.ls.get('IMPORT_TOPICS'));
    self.ts.registerLocal('angular_script', angularData);
	this.ts.load('admin/content/topics/import_topics', function(err, data) {
        var result = '' + data;
        cb({content: result});
    });
};

ImportTopics.getSubNavItems = function(key, ls, data) {
	var pills = Topics.getPillNavOptions();
    pills.unshift(
    {
        name: 'manage_topics',
        title: ls.get('IMPORT_TOPICS'),
        icon: 'chevron-left',
        href: '/admin/content/topics/manage_topics'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ImportTopics.getSubNavItems);

//exports
module.exports = ImportTopics;
