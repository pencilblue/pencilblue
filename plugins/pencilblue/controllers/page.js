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

//dependencies
var Index = require('./index.js');

/**
 * Loads a page
 * @class PageController
 * @constructor
 */
function PageController(){}

//inheritance
util.inherits(PageController, Index);

/**
 * Looks up a page and renders it
 * @see BaseController#render
 * @method render
 * @param {Function} cb
 */
PageController.prototype.render = function(cb) {
	var self    = this;
	var custUrl = this.pathVars.customUrl;

	//check for object ID as the custom URL
	var doRedirect = false;
	var where      = null;
	try {
		where      = {_id: pb.DAO.getObjectID(custUrl)};
		doRedirect = true;
	}
	catch(e){
		if (pb.log.isSilly()) {
			pb.log.silly("PageController: The custom URL was not an object ID [%s].  Will now search url field. [%s]", custUrl, e.message);
		}
	}

	// fall through to URL key
	if (where === null) {
		where = {url: custUrl};
	}

	var dao = new pb.DAO();
	dao.loadByValues(where, 'page', function(err, page) {
		if (util.isError(err) || page == null) {
			if (where.url) {
				self.reqHandler.serve404();
				return;
			}

			dao.loadByValues({url: custUrl}, 'page', function(err, page) {
				if (util.isError(err) || page == null) {
					self.reqHandler.serve404();
					return;
				}

				self.renderPage(page, cb);
			});

			return;
		}

		self.renderPage(page, cb);
	});
};

PageController.prototype.renderPage = function(page, cb) {
	this.req.pencilblue_page = page._id.toString();
	this.page = page;
	this.setPageName(page.name);
	PageController.super_.prototype.render.apply(this, [cb]);
};

/**
 * Retrieves the name of the page.  The page's headhile
 *
 */
PageController.prototype.getPageTitle = function() {
	return this.page.headline;
};

//exports
module.exports = PageController;
