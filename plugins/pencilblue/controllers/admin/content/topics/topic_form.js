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

//dependencies
var async = require('async');

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Interface for creating and editing topics
     */
    function TopicForm(){}
    util.inherits(TopicForm, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'topic_form';

    TopicForm.prototype.render = function(cb) {
        var self = this;
        var vars = this.pathVars;

        //gather all data
        this.gatherData(vars, function(err, data) {
            if (util.isError(err)) {
                throw err;
            }
            else if(!data.topic) {
                self.reqHandler.serve404();
                return;
            }

            self.topic = data.topic;
            data.pills = self.getAdminPills(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, self.topic);
            var angularObjects = pb.ClientJs.getAngularObjects(data);

            self.setPageName(self.topic[pb.DAO.getIdField()] ? self.topic.name : self.ls.g('topics.NEW_TOPIC'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/content/topics/topic_form', function(err, result) {
                cb({content: result});
            });
        });
    };

    TopicForm.prototype.gatherData = function(vars, cb) {
        var self = this;
        var tasks = {
            tabs: function(callback) {
                var tabs   =
                [
                    {
                        active: 'active',
                        href: '#topic_settings',
                        icon: 'cog',
                        title: self.ls.g('admin.SETTINGS')
                    }
                ];
                callback(null, tabs);
            },

            navigation: function(callback) {
                callback(null, pb.AdminNavigation.get(self.session, ['content', 'topics'], self.ls, self.site));
            },

            topic: function(callback) {
                if(!vars.id) {
                    callback(null, {});
                    return;
                }

                self.siteQueryService.loadById(vars.id, 'topic', function(err, topic) {
                    callback(err, topic);
                });
            }
        };
        async.series(tasks, cb);
    };

    TopicForm.getSubNavItems = function(key, ls, data) {
        return [{
            name: SUB_NAV_KEY,
            title: data[pb.DAO.getIdField()] ? ls.g('generic.EDIT') + ' ' + data.name : ls.g('topics.NEW_TOPIC'),
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
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, TopicForm.getSubNavItems);

    //exports
    return TopicForm;
};
