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
  function SiteForm() {}
  util.inherits(SiteForm, pb.BaseController);

  /**
   * @private
   * @static
   * @property SUB_NAV_KEY
   * @type {String}
   */
  var SUB_NAV_KEY = 'sites_edit';

  /**
   * Edit the site form to edit sites.
   * @method edit
   * @param {Function} cb - the callback function
   */
  SiteForm.prototype.edit = function(cb) {
    var self = this;
    var isNew = true;
    var id = this.pathVars.siteid;
    var dao = new pb.DAO();
    dao.loadByValue('uid', id, 'site', function(err, data) {
      if (util.isError(err)) {
        return cb(err);
      }

      var options = {};
      if (data) {
        options.isNew = false;
        options.display = data.displayName.toString();
        options.host = data.hostname.toString();
        options.savedLocales = data.supportedLocales;
        options.defaultLocale = data.defaultLocale;
        options.isActive = data.active;
        options.uid = data.uid;
      }

      setupAngularObj(self, options, cb);
    });
  };

  /**
   * New the site form to create sites.
   * @method new
   * @param {Function} cb - the callback function
   */
  SiteForm.prototype.new = function(cb) {
    var self = this;
    var options = {isNew: true};
    //todo:: refactor angular on site_form to remove unneeded properties
    setupAngularObj(self, options, cb);
  };

  function setupAngularObj(self, options, cb){
    var isNew = options.isNew,
      display = options.display,
      host = options.host,
      supportedLocales = {},
      savedLocales = options.savedLocales || {},
      selectedLocales = [],
      defaultLocale = options.defaultLocale || pb.Localization.getDefaultLocale(),
      isActive = options.isActive,
      uid = options.uid;

    savedLocales[defaultLocale] = true;

    selectedLocales = pb.Localization.getSupported().filter(function(locale) {
      return savedLocales[locale];
    });

    //Pre-select saved locales that match a supported locale
    for (var locale in pb.Localization.supportedLookup) {
      supportedLocales[locale] = savedLocales[locale] ? true : false;
    }

    var angularObjects = pb.ClientJs.getAngularObjects({
      navigation: pb.AdminNavigation.get(self.session, ['site_entity'], self.ls, self.site),
      pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
      tabs: [{ active: 'active', href: '#editSite', icon: 'cog', title: self.ls.get('EDIT_SITE') }],
      displayName: display,
      hostname: host,
      supportedLocales: supportedLocales,
      selectedLocales: selectedLocales,
      defaultLocale: defaultLocale,
      isNew: isNew,
      isActive: isActive,
      uid: uid
    });

    self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
    self.ts.load('admin/sites/site_form', function(err,result) {
      cb({content: result});
    });
  }

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
