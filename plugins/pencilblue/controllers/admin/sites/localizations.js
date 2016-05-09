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

module.exports = function LocalizationModule(pb) {
    //pb dependencies
    var util = pb.util;

    /**
     * Site Form renders a form to add/edit sites to the database.
     * @constructor
     * @extends BaseController
     */
    function Localization() {}
    util.inherits(Localization, pb.BaseController);

    /**
     * @private
     * @static
     * @property SUB_NAV_KEY
     * @type {String}
     */
    var SUB_NAV_KEY = 'sites_edit';

    /**
     * New the site form to create sites.
     * @method new
     * @param {Function} cb - the callback function
     */
    Localization.prototype.render = function(cb) {
        var self = this;
        setupAngularObj(self, cb);
    };

    function setupAngularObj(self, cb){
        var pluginService = new pb.PluginService({site: self.site});
        var activePlugins = pluginService.getActivePluginNames();
        var savedLocales = {},
            selectedLocales,
            defaultLocale = pb.Localization.getDefaultLocale();

        self.ts.registerLocal("active_theme", new pb.TemplateValue(self.activeTheme,false));
        savedLocales[defaultLocale] = true;

        selectedLocales = pb.Localization.getSupported().filter(function(locale) {
            return savedLocales[locale];
        });

        var angularObjects = pb.ClientJs.getAngularObjects({
            navigation: pb.AdminNavigation.get(self.session, ['site_entity'], self.ls, self.site),
            pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
            tabs: [
                { active: 'active', href: '#addLocale', icon: 'cog', title: self.ls.get('ADD_LOCALE') },
                { href: '#viewLocale', icon: 'eye', title: self.ls.get('VIEW_LOCALE') }
            ],
            activePlugins: activePlugins || [],
            activeTheme: self.activeTheme,
            siteName: self.siteName,
            site: self.site,
            supportedLocales: self.savedLocales,
            selectedLocales: selectedLocales,
            defaultLocale: defaultLocale
        });

        self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
        self.ts.load('admin/localization/localization', function(err,result) {
            cb({content: result});
        });
    }




    return Localization;
};
