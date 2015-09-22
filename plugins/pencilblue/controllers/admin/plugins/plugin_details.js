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
    var PluginService  = pb.PluginService;
    var LocalizationService = pb.LocalizationService;

    /**
    * Interface for viewing plugin details
    * @class PluginDetailsViewController
    * @constructor
    * @extends BaseAdminController
    */
    function PluginDetailsViewController(){}
    util.inherits(PluginDetailsViewController, pb.BaseAdminController);

    //statics
    var SUB_NAV_KEY = 'plugin_details';

    /**
     *
     * @method render
     * @param cb
     *
     */
    PluginDetailsViewController.prototype.render = function (cb) {
        var self = this;

        this.getDetails(this.pathVars.id, function (err, obj) {
            if (util.isError(err)) {
                throw err;
            }

            if (!obj.details) {
                self.reqHandler.serve404();
                return;
            }

            var angularObjects = pb.ClientJs.getAngularObjects({
                pills: self.getAdminPills(SUB_NAV_KEY, self.ls, null, obj),
                navigation: pb.AdminNavigation.get(self.session, ['plugins', 'manage'], self.ls, self.site),
                d: obj.details,
                status: obj.status,
                is_active: PluginService.isActivePlugin(obj.details.uid)
            });

            //render page
            self.setPageName(obj.details.name);
            self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
            self.ts.load('/admin/plugins/plugin_details', function(err, result) {
                cb({content: result});
            });
        });
    };

    /**
     *
     * @method getDetails
     *
     */
    PluginDetailsViewController.prototype.getDetails = function (puid, cb) {
        var self = this;

        var pluginService = new pb.PluginService({site: self.site});
        pluginService.getPluginBySite(puid, function(err, plugin) {
            if (util.isError(err)) {
                cb(err, plugin);
                return;
            }

            if (plugin) {
                var obj = {
                    details: plugin,
                    status: self.ls.get(PluginService.isActivePlugin(plugin.uid) ? 'ACTIVE' : 'INACTIVE')
                };
                cb(err, obj);
                return;
            }

            //try to load the details file.  We assume the puid variable is the
            //plugin directory name
            var detailsFile = PluginService.getDetailsPath(puid);
            PluginService.loadDetailsFile(detailsFile, function(err, details) {
                var obj = {
                    status: self.ls.get('ERRORED')
                };
                if (util.isError(err)) {
                    obj.details = {
                        name: puid,
                        uid: puid,
                        errors: [err.message]
                    };
                    cb(null, obj);
                    return;
                }

                //validate details
                PluginService.validateDetails(details, puid, function(err, result) {
                    obj.details = details;
                    if (util.isError(err)) {
                        details.errors = err.validationErrors;
                        cb(null, obj);
                        return;
                    }
                    obj.status = self.ls.get('AVAILABLE');
                    cb(null, obj);
                });
            });
        });
    };

    /**
     * @static
     * @method getSubNavItems
     *
     */
    PluginDetailsViewController.getSubNavItems = function(key, ls, data) {
        return [
            {
                name: 'manage',
                title: data.details.name,
                icon: 'chevron-left',
                href: '/admin/plugins'
            }
        ];
    };

    //register admin sub-nav
    pb.AdminSubnavService.registerFor(SUB_NAV_KEY, PluginDetailsViewController.getSubNavItems);

    //exports
    return PluginDetailsViewController;
};
