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
 * Deletes a section
 */

function DeleteSection(){}

//inheritance
util.inherits(DeleteSection, pb.BaseController);

DeleteSection.prototype.render = function(cb) {
	var self    = this;
	var vars    = this.pathVars;

	var message = this.hasRequiredParams(vars, ['id']);
	if (message) {
        this.formError(message, '/admin/content/sections/section_map', cb);
        return;
    }

	//ensure existence
	var dao = new pb.DAO();
	dao.loadById(vars.id, 'section', function(err, section) {
        if(section === null) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/sections/section_map', cb);
            return;
        }

        //delete the section
        var where = {$or: [{_id: ObjectID(vars.id)}, {parent: vars.id}]};
        dao.deleteMatching(where, 'section').then(function(result) {
        	if(result < 1) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/sections/section_map', cb);
                return;
            }

            self.session.success = section.name + ' ' + self.ls.get('DELETED');
            self.updateNavMap(vars.id, function(err, result) {
                self.redirect('/admin/content/sections/section_map', cb);
            });
        });
    });
};

DeleteSection.prototype.updateNavMap = function(removeID, cb) {
	var service = new pb.SectionService();
	service.removeFromSectionMap(removeID, cb);
};

//exports
module.exports = DeleteSection;
