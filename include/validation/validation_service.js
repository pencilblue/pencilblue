/**
 * Provides a set of functions for common validations.
 * 
 * @class ValidationService
 * @constructor
 * @module Validation
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC. All Rights Reserved
 */
function ValidationService(){}

var FILE_NAME_SAFE_REGEX = /^[a-zA-Z0-9-_\.]+$/;
var VERSION_REGEX        = /^[0-9]+\.[0-9]+\.[0-9]+$/;
var EMAIL_REGEX          = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var URL_REGEX            = /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/;

ValidationService.validateEmail = function(value, required) {
	if (!value && !required) {
		return true;
	}
	
	return pb.utils.isString(value) && value.search(EMAIL_REGEX) !== -1;
};

ValidationService.validateVersionNum = function(value, required) {
	if (!value && !required) {
		return true;
	}
	
	return pb.utils.isString(value) && value.search(VERSION_REGEX) !== -1;
};

ValidationService.validateUrl = function(value, required) {
	if (!value && !required) {
		return true;
	}

	return pb.utils.isString(value) && value.search(URL_REGEX) !== -1;
};

ValidationService.validateSafeFileName = function(value, required) {
	if (!value && !required) {
		return true;
	}

	return pb.utils.isString(value) && value.search(FILE_NAME_SAFE_REGEX) !== -1;
};

ValidationService.validateStr = function(value, required) {
	if (!value && !required) {
		return true;
	}
	return pb.utils.isString(value); 
};

ValidationService.validateNonEmptyStr = function(value, required) {
	if (!value && !required) {
		return true;
	}
	return pb.utils.isString(value) && value.length > 0; 
};

ValidationService.validateArray = function(value, required) {
	if (!value && !required) {
		return true;
	}
	return util.isArray(value); 
};

ValidationService.validateObject = function(value, required) {
	if (!value && !required) {
		return true;
	}
	return pb.utils.isObject(value); 
};

//exports
module.exports = ValidationService;
