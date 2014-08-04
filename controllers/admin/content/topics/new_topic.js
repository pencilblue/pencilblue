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
 * Interface for creating new topics
 */

function NewTopic(){}

//dependencies
var Topics = require('../topics');

//inheritance
util.inherits(NewTopic, pb.BaseController);

//statics
var SUB_NAV_KEY = 'new_topic';

NewTopic.prototype.render = function(cb) {
	var self = this;

    var tabs   =
    [
        {
            active: 'active',
            href: '#topic_settings',
            icon: 'cog',
            title: self.ls.get('SETTINGS')
        }
    ];

    var angularData = pb.js.getAngularController(
    {
        navigation: pb.AdminNavigation.get(self.session, ['content', 'topics'], self.ls),
        pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
        tabs: tabs
    });

	this.setPageName(self.ls.get('NEW_TOPIC'));
    self.ts.registerLocal('angular_script', angularData);
	this.ts.load('admin/content/topics/new_topic', function(err, data) {
        var result = '' + data;
        cb({content: result});
    });
};

NewTopic.getSubNavItems = function(key, ls, data) {
	var pills = Topics.getPillNavOptions();
	pills.unshift(
    {
        name: 'manage_topics',
        title: ls.get('NEW_TOPIC'),
        icon: 'chevron-left',
        href: '/admin/content/topics/manage_topics'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, NewTopic.getSubNavItems);

//exports
module.exports = NewTopic;
