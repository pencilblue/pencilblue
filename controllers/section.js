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
 * Loads a section
 */

function Section(){}

//dependencies
var Index = require('./index.js');

//inheritance
util.inherits(Section, Index);


Section.prototype.render = function(cb) {
	var self    = this;
	var custUrl = this.pathVars.customUrl;
	var dao     = new pb.DAO();
	dao.loadByValue('url', custUrl, 'section', function(err, section) {
		if (util.isError(err) || section == null) {
			self.reqHandler.serve404();
			return;
		}

		self.req.pencilblue_section = section._id.toString();
		this.section = section;
		Section.super_.prototype.render.apply(self, [cb]);
	});
};

Section.prototype.getPageTitle = function() {
	return this.section.name;
};

//exports
module.exports = Section;
