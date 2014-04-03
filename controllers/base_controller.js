/**
 * BaseController - The base controller provides functions for the majority of 
 * the heavy lifing for a controller. It accepts and provides access to 
 * extending controllers for items such as the request, response, session, etc.
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function BaseController(){};

BaseController.API_SUCCESS = 0;
BaseController.API_FAILURE = 1;

BaseController.prototype.init = function(props, cb) {
	this.req                 = props.request;
	this.res                 = props.response;
	this.session             = props.session;
	this.localizationService = props.localization_service;
	this.ls                  = this.localizationService;
	this.pathVars            = props.path_vars;
	this.query               = props.query;
	this.pageName            = '';
	
	var self = this;
	this.templateService     = new pb.TemplateService(this.localizationService);
	this.templateService.registerLocal('error_success', function(flag, cb) {
		self.displayErrorOrSuccessCallback(flag, cb);
	});
	this.templateService.registerLocal('page_name', function(flag, cb) {
		cb(null, self.getPageName());
	});
	this.ts = this.templateService;
	cb();
};

BaseController.prototype.formError = function(message, redirectLocation, cb) {
    
	this.session.error = message;      
    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + redirectLocation));
};

BaseController.prototype.displayErrorOrSuccessCallback = function(flag, cb) {
    if(this.session['error']) {
    	var error = this.session['error'];
        delete this.session['error'];
        cb(null, '<div class="alert alert-danger error_success">' + this.localizationService.get(error) + '<a href="javascript:$(\'.alert-danger.error_success\').hide()"><i class="fa fa-times" style="float: right;"></i></a></div>');
    }
    else if(this.session['success']) {
    	var success = this.session['success'];
        delete this.session['success'];
        cb(null, '<div class="alert alert-success error_success">' + this.localizationService.get(success) + '<a href="javascript:$(\'.alert-success.error_success\').hide()"><i class="fa fa-times" style="float: right;"></i></a></div>');
    }
    else {
        cb(null, '');
    }
};

/**
 * TODO - Remove after localization and templating refactor
 */
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

/**
 * Provides a page title.  This is picked up by the template engine when the 
 * ^page_name^ key is found in a template.
 * @returns {String} The title for the page
 */
BaseController.prototype.getPageName = function() {
	return this.pageName;
};

BaseController.prototype.setPageName = function(pageName) {
	this.pageName = pageName;
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
            return this.localizationService.get('FORM_INCOMPLETE');
        }
        else if (queryObject[requiredParameters[i]].length == 0) {
        	return this.localizationService.get('FORM_INCOMPLETE');
        }
    }
    
    if(queryObject['password'] && queryObject['confirm_password']) {
        if(queryObject['password'] != queryObject['confirm_password']) {
            return this.localizationService.get('PASSWORD_MISMATCH');
        }
    }
    
    return null;
};

BaseController.prototype.prepareFormReturns = function(result, cb) {
	this.checkForFormRefill(result, cb);
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

BaseController.apiResponse = function(cd, msg, dta) {
    if(typeof msg === 'undefined') {
        switch(cd) {
            case apiResponseCode.FAILURE:
                msg = 'FAILURE';
                break;
            case apiResponseCode.SUCCESS:
                msg = 'SUCCESS';
                break;
            default:
                msg = '';
                break;
        }
    }
    if(typeof dta === 'undefined') {
        dta = null;
    }
    var response = {code: cd, message: msg, data: dta};
    return JSON.stringify(response);
};

//exports
module.exports.BaseController = BaseController;
