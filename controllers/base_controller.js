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
var Sanitizer = require('sanitize-html');

/**
 * The base controller provides functions for the majority of
 * the heavy lifing for a controller. It accepts and provides access to
 * extending controllers for items such as the request, response, session, etc.
 * @class BaseController
 * @constructor
 */
function BaseController(){};

//constants
/**
 * The code for a successful API call
 * @static
 * @property API_SUCCESS
 * @type {Integer}
 */
BaseController.API_SUCCESS = 0;

/**
 * The code for a failed API call
 * @static
 * @property API_FAILURE
 * @type {Integer}
 */
BaseController.API_FAILURE = 1;

/**
 * The snippet of JS code that will ensure that a form is refilled with values
 * from the post
 * @static
 * @private
 * @property FORM_REFILL_PATTERN
 * @type {String}
 */
var FORM_REFILL_PATTERN = 'if(typeof refillForm !== "undefined") {' + "\n" +
	'$(document).ready(function(){'+ "\n" +
		'refillForm(%s)});}';

/**
 * The snippet of HTML that will display an alert box
 * @static
 * @private
 * @property ALERT_PATTERN
 * @type {String}
 */
var ALERT_PATTERN = '<div class="alert %s error_success">%s<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button></div>';

/**
 * Responsible for initializing a controller.  Properties from the
 * RequestHandler are passed down so that the controller has complete access to
 * a variety of request specified properties.  By default the function transfers the options over to instance variables that can be access during rendering.  In addition, the function sets up the template service along with a set of local flags:
 * <ul>
 * <li>locale - The selected locale for the request (NOTE: this may not match the requested language if not supported)</li>
 * <li>error_success - An alert box if one was registered by the controller</li>
 * <li>page_name - The title of the page</li>
 * <li>localization_script - Includes the localization script so that it can be used client side</li>
 * <li>analytics - Inserts the necessary javascript for analytics providers</li>
 * </ul>
 * @method init
 * @param {Object} props The properties needed to initialize the controller
 *  @param {RequestHandler} props.request_handler
 *  @param {Request} props.request The incoming request
 *  @param {Response} props.response The outgoing response
 *  @param {Object} props.session The session object
 *  @param {Localization} props.localization_service The localization service instance for the request
 *  @param {Object} props.path_vars The path variables associated with the URL for the request
 *  @param {Object} props.query The query string variables associated with the URL for the request
 *  @param {Function} cb A callback that takes a single optional argument: cb(Error)
 */
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
	this.templateService.registerLocal('wysiwyg', function(flag, cb) {
		var wysiwygId = pb.utils.uniqueId().toString();

		self.templateService.registerLocal('wys_id', wysiwygId);
		self.templateService.load('admin/elements/wysiwyg', function(err, data) {
			cb(err, new pb.TemplateValue(data, false));
		});
	});
	this.ts = this.templateService;

	cb();
};

/**
 *
 * @method requiresClientLocalization
 * @return {Boolean}
 */
BaseController.prototype.requiresClientLocalization = function() {
	return true;
};

/**
 *
 * @method requiresClientLocalizationCallback
 * @param {String} flag
 * @param {Function} cb
 */
BaseController.prototype.requiresClientLocalizationCallback = function(flag, cb) {
	var val = '';
	if (this.requiresClientLocalization()) {
		val = pb.js.includeJS(pb.UrlService.urlJoin('/localization', this.ls.language.replace('_', '-') + '.js'));
	}
	cb(null, new pb.TemplateValue(val, false));
};

/**
 *
 * @method formError
 * @param {String} message The error message to be displayed
 * @param {String} redirectLocation
 * @param {Function} cb
 */
BaseController.prototype.formError = function(message, redirectLocation, cb) {

	this.session.error = message;
    cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + redirectLocation));
};

/**
 *
 * @method displayErrorOrSuccessCallback
 * @param {String} flag
 * @param {Function} cb
 */
BaseController.prototype.displayErrorOrSuccessCallback = function(flag, cb) {
    if(this.session['error']) {
    	var error = this.session['error'];
        delete this.session['error'];
        cb(null, new pb.TemplateValue(util.format(ALERT_PATTERN, 'alert-danger', this.localizationService.get(error)), false));
    }
    else if(this.session['success']) {
    	var success = this.session['success'];
        delete this.session['success'];
        cb(null, new pb.TemplateValue(util.format(ALERT_PATTERN, 'alert-success', this.localizationService.get(success)), false));
    }
    else {
        cb(null, '');
    }
};

/**
 * Provides a page title.  This is picked up by the template engine when the
 * ^page_name^ key is found in a template.
 * @method getPageName
 * @return {String} The page title
 */
BaseController.prototype.getPageName = function() {
	return this.pageName;
};

/**
 * Sets the page title
 * @method setPageName
 * @param {String} pageName The desired page title
 */
BaseController.prototype.setPageName = function(pageName) {
	this.pageName = pageName;
};

/**
 *
 * @method getPostParams
 * @param {Function} cb
 */
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

/**
 * Parses the incoming payload of a request as JSON formatted data.
 * @method getJSONPostParams
 * @param {Function} cb
 */
BaseController.prototype.getJSONPostParams = function(cb) {
    this.getPostData(function(err, raw){
		if (util.isError(err)) {
			cb(err, null);
			return;
		}

        var error      = null;
		var postParams = null;
        try {
            postParams = JSON.parse(raw);
        }
        catch(err) {
            error = err;
        }
		cb(error, postParams);
	});
};

/**
 *
 * @method getPostData
 * @param {Function} cb
 */
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

/**
 *
 * @method hasRequiredParams
 * @param {Object} queryObject
 * @param {Array} requiredParameters
 */
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

/**
 *
 * @method setFormFieldValues
 * @param {Object} post
 */
BaseController.prototype.setFormFieldValues = function(post) {
    this.session.fieldValues = post;
    return this.session;
};

/**
 *
 * @method checkForFormRefill
 * @param {String} result
 * @param {Function} cb
 */
BaseController.prototype.checkForFormRefill = function(result, cb) {
    if(this.session.fieldValues) {
    	var content    = util.format(FORM_REFILL_PATTERN, JSON.stringify(this.session.fieldValues));
        var formScript = pb.js.getJSTag(content);
        result         = result.concat(formScript);

        delete this.session.fieldValues;
    }

    cb(result);
};

/**
 * Sanitizes an object.  This function is handy for incoming post objects.  It
 * iterates over each field.  If the field is a string value it will be
 * sanitized based on the default sanitization rules
 * (BaseController.getDefaultSanitizationRules) or those provided by the call
 * to BaseController.getSanitizationRules.
 * @method sanitizeObject
 * @param {Object}
 */
BaseController.prototype.sanitizeObject = function(obj) {
    if (!pb.utils.isObject(obj)) {
        return;
    }

    var rules = this.getSanitizationRules();
    for(var prop in obj) {
        if (pb.utils.isString(obj[prop])) {

            var config = rules[prop];
            obj[prop] = BaseController.sanitize(obj[prop], config);
        }
    }
};

/**
 *
 * @method getSanitizationRules
 */
BaseController.prototype.getSanitizationRules = function() {
    return {};
};

/**
 * The sanitization rules that apply to Pages and Articles
 * @static
 * @method getContentSanitizationRules
 */
BaseController.getContentSanitizationRules = function() {
    return {
        allowedTags: [ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div', 'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'u', 'span' ],
        allowedAttributes: {
            a: [ 'href', 'name', 'target', 'class', 'align'],
            img: [ 'src', 'class', 'align'],
            p: ['align', 'class'],
            h1: ['style', 'class', 'align'],
            h2: ['style', 'class', 'align'],
            h3: ['style', 'class', 'align'],
            h4: ['style', 'class', 'align'],
            h5: ['style', 'class', 'align'],
            h6: ['style', 'class', 'align'],
            div: ['style', 'class', 'align'],
            span: ['style', 'class', 'align']
        },

        // Lots of these won't come up by default because we don't allow them
        selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],

        // URL schemes we permit
        allowedSchemes: [ 'http', 'https', 'ftp', 'mailto' ]
    };
};

/**
 * @static
 * @method getDefaultSanitizationRules
 */
BaseController.getDefaultSanitizationRules = function() {
    return {
        allowedTags: [],
        allowedAttributes: {}
    };
};

/**
 *
 * @static
 * @method sanitize
 * @param {String} value
 * @param {Object} [config]
 */
BaseController.sanitize = function(value, config) {
    if (!value) {
        return value;
    }
    else if (!pb.utils.isObject(config)) {
        config = BaseController.getDefaultSanitizationRules();
    }
    return Sanitizer(value, config);
};

/**
 * Redirects a request to a different location
 * @method redirect
 * @param {String} location
 * @param {Function} cb
 */
BaseController.prototype.redirect = function(location, cb){
	cb(pb.RequestHandler.generateRedirect(location));
};

/**
 * Generates an generic API response object
 * @static
 * @method apiResponse
 * @return {String} JSON
 */
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
