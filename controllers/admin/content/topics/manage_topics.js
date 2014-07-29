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
 * Interface for managing topics
 */

function ManageTopics() {}

//dependencies
var Topics = require('../topics');

//inheritance
util.inherits(ManageTopics, pb.BaseController);

var SUB_NAV_KEY = 'manage_topics';

ManageTopics.prototype.render = function(cb) {
	var self = this;
	var dao  = new pb.DAO();
	dao.query('topic', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL).then(function(topics) {
		if (util.isError(topics)) {
			//TODO handle this
		}

		//none to manage
        if(topics.length === 0) {
            self.redirect('/admin/content/topics/new_topic', cb);
            return;
        }

        //currently, mongo cannot do case-insensitive sorts.  We do it manually
        //until a solution for https://jira.mongodb.org/browse/SERVER-90 is merged.
        topics.sort(function(a, b) {
            var x = a.name.toLowerCase();
            var y = b.name.toLowerCase();

            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });

        var angularData = pb.js.getAngularController(
        {
            navigation: pb.AdminNavigation.get(self.session, ['content', 'topics'], self.ls),
            pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
            topics: topics
        }, [], 'initTopicsPagination()');

        self.setPageName(self.ls.get('MANAGE_TOPICS'));
        self.ts.registerLocal('angular_script', angularData);
        self.ts.load('admin/content/topics/manage_topics', function(err, data) {
            var result = '' + data;
            cb({content: result});
        });
    });
};

ManageTopics.getSubNavItems = function(key, ls, data) {
	var pills = Topics.getPillNavOptions();
	pills.unshift(
    {
        name: SUB_NAV_KEY,
        title: ls.get('MANAGE_TOPICS'),
        icon: 'refresh',
        href: '/admin/content/topics/manage_topics'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageTopics.getSubNavItems);

//exports
module.exports = ManageTopics;
