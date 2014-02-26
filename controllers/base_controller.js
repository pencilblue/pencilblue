/**
 * BaseController - The base controller provides functions for the majority of 
 * the heavy lifing for a controller. It accepts and provides access to 
 * extending controllers for items such as the request, response, session, etc.
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function BaseController(){};

BaseController.prototype.init = function(props, cb) {
	this.req                 = props.request;
	this.res                 = props.response;
	this.session             = props.session;
	this.localizationService = props.localization_service;
	this.pathVars            = props.path_vars;
	this.query               = props.query;
	cb();
};

BaseController.prototype.formError = function(message, redirectLocation, cb) {
    
	this.session.error = message;      
    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + redirectLocation));
};

BaseController.prototype.displayErrorOrSuccess = function(result, cb) {
    if(this.session['error']) {
        result = result.split('^error_success^').join('<div class="alert alert-danger error_success">' + this.session['error'] + '<a href="javascript:$(\'.alert-danger.error_success\').hide()"><i class="fa fa-times" style="float: right;"></i></a></div>');
        delete this.session['error'];
    }
    else if(this.session['success']) {
        result = result.split('^error_success^').join('<div class="alert alert-success error_success">' + this.session['success'] + '<a href="javascript:$(\'.alert-success.error_success\').hide()"><i class="fa fa-times" style="float: right;"></i></a></div>');
        delete this.session['success'];
    }
    else {
        result = result.split('^error_success^').join('');
    }
    
    cb(result);
};

BaseController.prototype.getPostParams = function(cb) {
	this.getPostData(function(err, raw){
		if (util.isError(err)) {
			cb(err, null);
			return;
		}
		
		var postParams = url.parse('?' + raw, true).query;
		cb(null, postParams);
	});
};

BaseController.prototype.getPostData = function(cb) {
	var body = '';
    this.req.on('data', function (data) {
        body += data;
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) { 
            // FLOOD ATTACK OR FAULTY CLIENT, NUKE REQUEST
            cb(new PBError("POST limit reached! Maximum of 1MB.", 400), null);
        }
    });
    this.req.on('end', function () {
    	cb(null, body);
    });
};

BaseController.prototype.hasRequiredParams = function(queryObject, requiredParameters) {
    
	for (var i = 0; i < requiredParameters.length; i++) {
        
		if (typeof queryObject[requiredParameters[i]] === 'undefined') {
            return '^loc_FORM_INCOMPLETE^';
        }
        else if (queryObject[requiredParameters[i]].length == 0) {
            return '^loc_FORM_INCOMPLETE^';
        }
    }
    
    if(queryObject['password'] && queryObject['confirm_password']) {
        if(queryObject['password'] != queryObject['confirm_password']) {
            return '^loc_PASSWORD_MISMATCH^';
        }
    }
    
    return null;
};

BaseController.prototype.prepareFormReturns = function(result, cb) {
	var self = this;
    this.displayErrorOrSuccess(result, function(newResult) {
        self.checkForFormRefill(newResult, cb);
    });
};

BaseController.prototype.setFormFieldValues = function(post) {
    this.session.fieldValues = post;
    return this.session;
};

BaseController.prototype.checkForFormRefill = function(result, cb) {
    if(this.session.fieldValues) {
        var formScript = pb.js.getJSTag('if(typeof refillForm !== "undefined") $(document).ready(function(){refillForm(' + JSON.stringify(this.session.fieldValues) + ')})');
        result         = result.concat(formScript);
        
        delete this.session.fieldValues;
    }
    
    cb(result);
};

BaseController.prototype.redirect = function(location, cb){
	cb(pb.RequestHandler.generateRedirect(location));
};

//exports
module.exports.BaseController = BaseController;
