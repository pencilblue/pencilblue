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
 * Edits a section
 */

//dependencies
var BaseController = pb.BaseController;
var FormController = pb.FormController;

function EditSectionPostController(){
	this.wasContainer = false;
}

//inheritance
util.inherits(EditSectionPostController, FormController);

EditSectionPostController.prototype.onPostParamsRetrieved = function(post, cb){
	var self = this;

	//load object
	this.getObject(post, function(err, navItem) {
		if (util.isError(err)) {
			throw err;
		}
		else if (!pb.utils.isObject(navItem)) {
			self.reqHandler.serve404();
			return;
		}

		//ensure a URL was provided
        if(!navItem.url && navItem.name) {
            navItem.url = navItem.name.toLowerCase().split(' ').join('-');
        }

		//strip unneeded properties
		pb.SectionService.trimForType(navItem);

		//validate
		var navService = new pb.SectionService();
        navService.save(navItem, function(err, result) {
			if (util.isError(err)) {
				return self.reqHandler.serveError(err);
			}
			else if (util.isArray(result) && result.length > 0) {
				self.setFormFieldValues(post);
				var errMsg   = EditSectionPostController.getHtmlErrorMsg(result);
				var redirect = self.getFormLocation();
				self.formError(errMsg, redirect, cb);
				return;
			}

			//finally do the callback
            self.session.success = self.getSuccessMessage(navItem);
            self.redirect('/admin/content/sections/section_map', cb);
		});
	});
};

EditSectionPostController.prototype.deleteOrphans = function(navItem, cb) {
	var service = new pb.SectionService();
	service.deleteChildren(navItem._id, cb);
};

EditSectionPostController.prototype.getSuccessMessage = function(navItem) {
	return navItem.name + ' ' + this.ls.get('EDITED');
};

EditSectionPostController.prototype.getFormLocation = function() {
	return pb.UrlService.urlJoin('/admin/content/sections/edit_section', this.pathVars.id);
};

EditSectionPostController.prototype.getObject = function(post, cb) {
	var self = this;
	var dao  = new pb.DAO();
	dao.loadById(this.pathVars.id, 'section', function(err, navItem) {
		if (util.isError(err)) {
			cb(err, null);
			return;
		}
		else if (!pb.utils.isObject(navItem)) {
			cb(null, null);
			return;
		}

		//determine if nav item is no longer a container
		//we'll later have to deal with the orphans (if any)
		self.wasContainer = navItem.type === 'container';

		//merge in new properties
		pb.DocumentCreator.update(post, navItem, ['keywords'], ['url', 'parent']);
		cb(null, navItem);
	});
};

EditSectionPostController.prototype.checkForNavMapUpdate = function(navItem, cb) {
	var service = new pb.SectionService();
	service.updateNavMap(navItem, cb);
};

EditSectionPostController.getHtmlErrorMsg = function(validationErrors) {
	var html = '';
	for (var i = 0; i < validationErrors.length; i++) {
		if (i > 0) {
			html += '<br/>';
		}
		html += validationErrors[i].field + ':' + validationErrors[i].message;
	}
	return html;
};

//exports
module.exports = EditSectionPostController;
