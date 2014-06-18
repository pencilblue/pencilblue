/**
 * BaseController - The base controller provides functions for the majority of 
 * the heavy lifing for a controller. It accepts and provides access to 
 * extending controllers for items such as the request, response, session, etc.
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue, LLC. 2014 All Rights Reserved
 */
function BaseController(){};

//constants
BaseController.API_SUCCESS = 0;
BaseController.API_FAILURE = 1;

var FORM_REFILL_PATTERN = 'if(typeof refillForm !== "undefined") {' + "\n" +
	'$(document).ready(function(){'+ "\n" + 
		'refillForm(%s)});}';

var ALERT_PATTERN = '<div class="alert %s error_success">%s<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button></div>';

BaseController.prototype.init = function(props, cb) {
	this.reqHandler          = props.request_handler;
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
	this.templateService.registerLocal('locale', this.ls.language);
	this.templateService.registerLocal('error_success', function(flag, cb) {
		self.displayErrorOrSuccessCallback(flag, cb);
	});
	this.templateService.registerLocal('page_name', function(flag, cb) {
		cb(null, self.getPageName());
	});
	this.templateService.registerLocal('localization_script', function(flag, cb) {
		self.requiresClientLocalizationCallback(flag, cb);
	});
    this.templateService.registerLocal('analytics', function(flag, cb) {
		pb.AnalyticsManager.onPageRender(self.req, self.session, self.ls, cb);
	});
	this.ts = this.templateService;
	cb();
};

BaseController.prototype.requiresClientLocalization = function() {
	return true;
};

BaseController.prototype.requiresClientLocalizationCallback = function(flag, cb) {
	var val = '';
	if (this.requiresClientLocalization()) {
		val = pb.js.includeJS(pb.UrlService.urlJoin('/localization', this.ls.language.replace('_', '-') + '.js'));
	}
	cb(null, new pb.TemplateValue(val, false));
};

BaseController.prototype.formError = function(message, redirectLocation, cb) {
    
	this.session.error = message;      
    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + redirectLocation));
};

BaseController.prototype.displayErrorOrSuccessCallback = function(flag, cb) {
    if(this.session['error']) {
    	var error = this.session['error'];
        delete this.session['error'];
        cb(null, new pb.TemplateValue(util.format(ALERT_PATTERN, 'alert-danger', this.localizationService.get(error)), false));
    }
    else if(this.session['success']) {
    	var success = this.session['success'];
        delete this.session['success'];
        cb(null, new pb.TemplateValue(util.format(ALERT_PATTERN, 'alert-success', this.localizationService.get(success))));
    }
    else {
        cb(null, '');
    }
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

BaseController.prototype.setFormFieldValues = function(post) {
    this.session.fieldValues = post;
    return this.session;
};

BaseController.prototype.checkForFormRefill = function(result, cb) {
    if(this.session.fieldValues) {
    	var content    = util.format(FORM_REFILL_PATTERN, JSON.stringify(this.session.fieldValues));
        var formScript = pb.js.getJSTag(content);
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
            case BaseController.FAILURE:
                msg = 'FAILURE';
                break;
            case BaseController.SUCCESS:
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
