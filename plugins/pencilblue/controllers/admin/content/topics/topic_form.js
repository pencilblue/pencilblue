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

//dependencies
var async = require('async');

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Interface for creating and editing topics
     */
    function TopicForm(){}
    util.inherits(TopicForm, pb.BaseController);

    TopicForm.prototype.init = function (props, cb) {
        var self = this;
        pb.BaseController.prototype.init.call(self, props, function () {
            self.pathSiteUId = pb.SiteService.getCurrentSite(self.pathVars.siteid);
            pb.SiteService.siteExists(self.pathSiteUId, function (err, exists) {
                if (!exists) {
                    self.reqHandler.serve404();
                }
                else {
                    self.sitePrefix = pb.SiteService.getCurrentSitePrefix(self.pathSiteUId);
                    self.queryService = new pb.SiteQueryService(self.pathSiteUId, true);
                    self.settings = pb.SettingServiceFactory.getServiceBySite(self.pathSiteUId, true);
                    var siteService = new pb.SiteService();
                    siteService.getSiteNameByUid(self.pathSiteUId, function (siteName) {
                        self.siteName = siteName;
                        cb();
                    });
                }
            });
        });
    };

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
            data.sitePrefix = self.sitePrefix;
            var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, data);
            data.pills = pb.AdminSubnavService.addSiteToPills(pills, self.siteName);
            var angularObjects = pb.ClientJs.getAngularObjects(data);

            self.setPageName(self.topic[pb.DAO.getIdField()] ? self.topic.name : self.ls.get('NEW_TOPIC'));
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
                        title: self.ls.get('SETTINGS')
                    }
                ];
                callback(null, tabs);
            },

            navigation: function(callback) {
                callback(null, pb.AdminNavigation.get(self.session, ['content', 'topics'], self.ls));
            },

            topic: function(callback) {
                if(!vars.id) {
                    callback(null, {});
                    return;
                }

                var dao = new pb.DAO();
                dao.loadById(vars.id, 'topic', function(err, topic) {
                    callback(err, topic);
                });
            }
        };
        async.series(tasks, cb);
    };

    TopicForm.getSubNavItems = function(key, ls, data) {
        var topic = data.topic;
        var prefix = data.sitePrefix;
        return [{
            name: SUB_NAV_KEY,
            title: topic[pb.DAO.getIdField()] ? ls.get('EDIT') + ' ' + topic.name : ls.get('NEW_TOPIC'),
            icon: 'chevron-left',
            href: '/admin' + prefix + '/content/topics'
        }, {
            name: 'import_topics',
            title: '',
            icon: 'upload',
            href: '/admin' + prefix + '/content/topics/import'
        }, {
            name: 'new_topic',
            title: '',
            icon: 'plus',
            href: '/admin' + prefix + '/content/topics/new'
        }];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, TopicForm.getSubNavItems);

    //exports
    return TopicForm;
};
