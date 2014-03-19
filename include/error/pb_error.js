/**
 * PBError - Specialized application error that knows what status code to return
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC 2014 All Rights Reserved
 */
function PBError(message, httpStatus) {
	this.message         = message ? message : '';
	this.httpStatus      = httpStatus ? httpStatus : 500;
	this.localizationKey = null;
	this.source          = null;
};

//setup inheritance
util.inherits(PBError, Error);

/**
 * 
 * @param key {string}
 */
PBError.prototype.setLocalizatonKey = function(key){
	this.localizationKey = key;
	return this;
};

PBError.prototype.setSource = function(err){
	this.source = err;
	return this;
};

//exports
module.exports.PBError = PBError;