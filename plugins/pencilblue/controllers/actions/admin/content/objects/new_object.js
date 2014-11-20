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
* Creates an object
* @class NewObject
* @constructor
* @extends FormController
*/
function NewObject(){}

//inheritance
util.inherits(NewObject, pb.BaseController);

NewObject.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;

	if(!vars.type_id) {
		cb({
			code: 400,
			content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
		});
		return
	}

	var service = new pb.CustomObjectService();
	service.loadTypeById(vars.type_id, function(err, customObjectType) {
		if(util.isError(err) || !pb.utils.isObject(customObjectType)) {
			cb({
				code: 400,
				content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
			});
			return;
		}

		self.customObjectType = customObjectType;

		self.getJSONPostParams(function(err, post) {
			//format post object
			for(var key in post) {
				if(customObjectType.fields[key] && customObjectType.fields[key].field_type === 'date') {
					post[key] = new Date(post[key]);
				}
			}
			var customObjectDocument = pb.DocumentCreator.create('custom_object', post);

			service.save(customObjectDocument, customObjectType, function(err, result) {
				if(util.isError(err)) {
					cb({
						code: 500,
						content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
					});
					return;
				}
				else if(util.isArray(result) && result.length > 0) {
					cb({
						code: 500,
						content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
					});
					return;
				}

				cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, customObjectDocument.name + ' ' + self.ls.get('CREATED'), result)});
			});
		});
	});
};

NewObject.prototype.getSanitizationRules = function() {
	var sanitizationRules = {};
	for(var key in self.customObjectType.fields) {
		if(customObjectType.fields[key].field_type === 'wysiwyg') {
			sanitizationRules[key] = pb.BaseController.getContentSanitizationRules();
		}
	}

	return sanitizationRules;
};

//exports
module.exports = NewObject;
