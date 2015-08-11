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

module.exports = function SiteFormModule(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Site Form renders a form to add/edit sites to the database.
     * @constructor
     * @extends BaseController
     */
    function SiteForm(){}
    util.inherits(SiteForm, pb.BaseController);

    /**
     * @private
     * @static
     * @property SUB_NAV_KEY
     * @type {String}
     */
    var SUB_NAV_KEY = 'sites_edit';

    /**
     * Renders the site form to create and edit sites.
     * @method render
     * @param {Function} cb - the callback function
     */
    SiteForm.prototype.render = function(cb) {
        var self = this;
        var isNew = true;
        var id = this.pathVars.siteid;
        var dao = new pb.DAO();
        dao.loadByValue('uid', id, 'site', function(err, data) {
            if (util.isError(err)) {
                return cb(err);
            }
            
            var display, host, isActive, uid;
            if (data) {
                isNew = false;
                display = data.displayName.toString();
                host = data.hostname.toString();
                isActive = data.active;
                uid = data.uid;
            }

            var angularObjects = pb.ClientJs.getAngularObjects({
                navigation: pb.AdminNavigation.get(self.session, ['site_entity'], self.ls, self.site),
                pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
                tabs: [{ active: 'active', href: '#editSite', icon: 'cog', title: self.ls.get('EDIT_SITE') }],
                displayName: display,
                hostname: host,
                isNew: isNew,
                isActive: isActive,
                uid: uid
            });

            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('admin/sites/site_form', function(err,result) {
                cb({content: result});
            });
        });

    };

    /**
     * Gets an array of nav objects for pills.
     * @method getSubNavItems
     * @param key
     * @param {Object} ls - the localization service
     * @returns {Array} the array of nav objects to render.
     */
    SiteForm.getSubNavItems = function(key, ls) {
        return [{
            name: 'edit_sites',
            title: ls.get('EDIT_SITE'),
            icon: 'chevron-left',
            href: '/admin/sites'
        }, {
            name: 'new_site',
            title: '',
            icon: 'plus',
            href: '/admin/sites/new'
        }];
    };

    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, SiteForm.getSubNavItems);

    return SiteForm;
};