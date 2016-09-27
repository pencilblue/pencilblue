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

module.exports = function (pb) {

    //pb dependencies
    var util            = pb.util;
    var SecurityService = pb.SecurityService;

    /**
     * Interface for the admin dashboard
     * @class AdminIndexController
     * @constructor
     */
    function AdminIndexController(){}
    util.inherits(AdminIndexController, pb.BaseAdminController);

    /**
     *
     * @method onSiteValidated
     * @param site
     * @param cb
     *
     */
    AdminIndexController.prototype.render = function (cb) {
        var self = this;

        //gather all the data
        this.gatherData(function(err, data) {
            if (util.isError(err)) {
                //throw err;
            }

            var name = self.localizationService.g('admin.ARTICLES');
            var contentInfo = [
               {
                   name: name,
                   count: data.articleCount,
                   href: '/admin/content/articles'
               },
            ];

            name = self.ls.g('admin.PAGES');
            contentInfo.push({name: name, count: data.pageCount, href: '/admin/content/pages'});

            var angularObjects = pb.ClientJs.getAngularObjects({
                navigation: pb.AdminNavigation.get(self.session, ['dashboard'], self.localizationService, self.site),
                contentInfo: contentInfo,
                cluster: data.clusterStatus,
                access: self.session.authentication.admin_level,
                isAdmin: self.session.authentication.admin_level === SecurityService.ACCESS_ADMINISTRATOR
            });
            self.setPageName(self.ls.g('admin.DASHBOARD'));
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/index', function(error, result) {
                cb({content: result});
            });
        });
    };

    /**
     * Gather all necessary data for rendering the dashboard.
     * <ul>
     * <li>Article count</li>
     * <li>Page Count</li>
     * <li>Cluster Status</li>
     * </ul>
     * @method gatherData
     * @param {Function} cb A callback that provides two parameters: cb(Error, Object)
     */
    AdminIndexController.prototype.gatherData = function(cb) {
        var self = this;
        var tasks = {

            //article count
            articleCount: function(callback) {
                self.siteQueryService.count('article', pb.DAO.ANYWHERE, callback);
            },

            //page count
            pageCount: function(callback) {
                self.siteQueryService.count('page', pb.DAO.ANYWHERE, callback);
            },

            //cluster status
            clusterStatus: function(callback) {
                var service = pb.ServerRegistration.getInstance();
                service.getClusterStatus(function(err, cluster) {
                    callback(err, cluster);
                });
            }
        };
        async.parallel(tasks, cb);
    };

    //exports
    return AdminIndexController;
};
