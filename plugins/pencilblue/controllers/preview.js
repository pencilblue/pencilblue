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
 * Preview an article or page
 */

function Preview(){}

//dependencies
var Index = require('./index.js');

//inheritance
util.inherits(Preview, Index);


Preview.prototype.render = function(cb) {
	var self    = this;
	var vars    = this.pathVars;

	var dao     = new pb.DAO();
	dao.loadById(vars.id, vars.type, function(err, item) {
		if (util.isError(err) || item === null) {
			cb({content: 'The section could not be found on this server', code: 404});
			return;
		}

		self.req.pencilblue_preview = item._id.toString();
		switch(vars.type) {
		    case 'page':
		        self.req.pencilblue_page = item._id.toString();
		        this.page = item;
		        break;
		    case 'article':
		    default:
		        self.req.pencilblue_article = item._id.toString();
		        this.article = item;
		        break;
        }
		Preview.super_.prototype.render.apply(self, [cb]);
	});
};

Preview.prototype.getPageTitle = function() {
	return article.name;
};

//exports
module.exports = Preview;
