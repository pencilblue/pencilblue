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
 * Search for headline or subheading matching search term
 */

function ContentSearchController() {}

//dependencies
var BaseController = pb.BaseController;

//inheritance
util.inherits(ContentSearchController, BaseController);

//constants
var VALID_CONTENT_TYPES = {
    article: true,
    page: true
};

var MAX_RESULTS = 100;

var MIN_LENGTH  = 3;

ContentSearchController.prototype.render = function(cb) {
	var type   = this.query.type;
	var search = this.query.q;

	//perform validation
	var errors = ContentSearchController.validate(type, search);
	if (errors.length > 0) {
		var content = BaseController.apiResponse(BaseController.API_FAILURE, '', errors);
		cb({content: content, code: 400});
		return;
	}

	//build query
	var pattern = new RegExp(".*"+search+".*", "i");
	var where   = {
		$or: [
		    {headline: pattern},
		    {subheading: pattern},
        ]
	};
	var select = {
		headline: 1,
	};

	//do query and get results
	var dao = new pb.DAO();
	dao.query(type, where, select, pb.DAO.NATURAL_ORDER, MAX_RESULTS).then(function(items) {
		if (util.isError(items)) {
			var content = BaseController.apiResponse(BaseController.API_FAILURE, '', '');
			cb({content: content, code: 500});
			return;
		}

		//change to display
		for (var i = 0; i < items.length; i++) {
			items[i].display = items[i].headline;
			delete items[i].headline;
		}

		var content = BaseController.apiResponse(BaseController.API_SUCCESS, '', items);
		cb({content: content});
	});
};

ContentSearchController.validate = function(type, search) {
	var errors = [];
	if (!VALID_CONTENT_TYPES[type]) {
		errors.push('A valid content type is required');
	}
	if (!pb.validation.validateNonEmptyStr(search, true) || search.length < MIN_LENGTH) {
		errors.push('The search term must be at least '+MIN_LENGTH+' characters long');
	}
	return errors;
};

//exports
module.exports = ContentSearchController;
