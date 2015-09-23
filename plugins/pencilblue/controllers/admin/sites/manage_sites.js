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

    var util = pb.util;

    /**
     * Renders a view to display and manage all the sites
     * @constructor
     * @extends BaseController
     */
    function ManageSites(){}
    util.inherits(ManageSites, pb.BaseController);

    var SUB_NAV_KEY = 'sites_manage';

    /**
     * Render view to manage sites.
     * @method render
     * @param {Function} cb - callback function
     */
    ManageSites.prototype.render = function(cb) {
        var self = this;
        var siteService = new pb.SiteService();
        siteService.getSiteMap(function(err, map) {
            var angularObjects = pb.ClientJs.getAngularObjects({
                navigation: pb.AdminNavigation.get(self.session, ['site_entity'], self.ls, self.site),
                pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
                activeSites: map.active,
                inactiveSites: map.inactive
            });
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/sites/manage_sites', function(err,result) {
                cb({content: result});
            });
        });
    };

    /**
     * Get array of nav items for nav pills.
     * @method getSubNavItems
     * @param {String} key
     * @param {Object} ls
     * @returns {Array} array of nav items
     */
    ManageSites.getSubNavItems = function(key, ls) {
        return [{
            name: 'manage_sites',
            title: ls.get('MANAGE_SITES'),
            icon: 'refresh',
            href: '/admin/sites'
        }, {
            name: 'new_site',
            title: '',
            icon: 'plus',
            href: '/admin/sites/new'
        }];
    };

    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageSites.getSubNavItems);

    return ManageSites;
};