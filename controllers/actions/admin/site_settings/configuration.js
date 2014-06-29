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
 * Saves the site's setting to call home
 */

function ConfigurationSettingsPostController(){}

//inheritance
util.inherits(ConfigurationSettingsPostController, pb.FormController);

ConfigurationSettingsPostController.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

    var callHome = post.call_home == 1;
    pb.settings.set('call_home', callHome, function(data) {
        if(util.isError(data)) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/site_settings/configuration', cb);
            return;
        }

        self.session.success = self.ls.get('CONFIGURATION_SETTINGS') + ' ' +  self.ls.get('EDITED');
        self.redirect('/admin/site_settings/configuration', cb);
    });
};

//exports
module.exports = ConfigurationSettingsPostController;
