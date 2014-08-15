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
 * Saves the site's content settings
 */

function Libraries(){}

//inheritance
util.inherits(Libraries, pb.FormController);

Libraries.prototype.onPostParamsRetrieved = function(post, cb) {
    var self = this;
    self.setFormFieldValues(post);

    var message = this.hasRequiredParams(post, ['jquery']);
    if(message) {
        this.formError(message, '/admin/site_settings/libraries', cb);
        return;
    }

    pb.settings.set('libraries_settings', post, function(data) {
        if(util.isError(data)) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/site_settings/libraries', cb);
            return;
        }

        for(var key in post) {
            pb.TemplateService.registerGlobal(key + '_src', post[key]);
        }

        self.session.success = self.ls.get('LIBRARY_SETTINGS') + ' ' + self.ls.get('EDITED') + '<br/>' + self.ls.get('LIBRARY_CLUSTER');
        self.redirect('/admin/site_settings/libraries', cb);
    });
};

//exports
module.exports = Libraries;
