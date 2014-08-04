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
 * Updates the navigation
 */

function SectionMap(){}

//inheritance
util.inherits(SectionMap, pb.FormController);

SectionMap.prototype.onPostParamsRetrieved = function(post, cb) {
	var self = this;

	var message = this.hasRequiredParams(post, ['map']);
	if(message) {
        this.formError(message, '/admin/content/sections/section_map', cb);
        return;
    }

    var sectionMap = JSON.parse(decodeURIComponent(post.map));
    if(sectionMap.length <= 0 || !sectionMap[0].uid) {
        this.formError(self.ls.get('ERROR_SAVING'), '/admin/content/sections/section_map', cb);
        return;
    }

    pb.settings.set('section_map', sectionMap, function(err, data) {
		if(util.isError(err)) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/sections/section_map', cb);
            return;
        }

        self.session.success = self.ls.get('NAV_MAP_SAVED');
        self.redirect('/admin/content/sections/section_map', cb);
    });
};

//exports
module.exports = SectionMap;
