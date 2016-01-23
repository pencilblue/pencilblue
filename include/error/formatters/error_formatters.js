/*
    Copyright (C) 2015  PencilBlue, LLC

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
var path        = require('path');
var HtmlEncoder = require('htmlencode');

module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Provides functions and mechanisms to serialize errors
     * @class ErrorFormatters
     * @constructor
     */
    function ErrorFormatters() {}
    
    /**
     * The fallback MIME type
     * @private
     * @static
     * @readonly
     * @property DEFAULT_MIME
     * @type {String}
     */
    var DEFAULT_MIME = 'text/html';
    
    /**
     * Error code when a validation failure occurs
     * @private
     * @static
     * @readonly
     * @property BAD_REQUEST
     * @type {Integer}
     */
    var BAD_REQUEST = 400;
    
    /**
     * Converts an error to a plain object that can be serialized
     * @private
     * @static
     * @method convertToObject
     * @param {Object} params
     * @return {Object}
     */
    var convertToObject = function(params) {
        var content = {
            code: params.error.code,
            message: params.error.message
        };
        if (pb.config.logging.showErrors) {
            content.stack = params.error.stack;
        }
        if (params.error.code === BAD_REQUEST) {
            delete content.stack;
            content.validationErrors = params.error.validationErrors;
        }
        return content;
    };
    
    /**
     * @private
     * @static
     * @property failedControllerPaths
     * @type {Object}
     */
    var failedControllerPaths = {};

    /**
     * Serializes an error as JSON
     * @static
     * @method html
     * @param {Object} params
     * @param {String} params.mime The MIME type of the format to render
     * @param {Error} params.error The error to be rendered
     * @param {Request} [params.request]
     * @param {Localization} [params.localization]
     * @param {Function} cb
     */
    ErrorFormatters.json = function(params, cb){
        cb(
            null,
            JSON.stringify(convertToObject(params))
        );
    };

    /**
     * Serializes an error as HTML
     * @static
     * @method html
     * @param {Object} params
     * @param {String} params.mime The MIME type of the format to render
     * @param {Error} params.error The error to be rendered
     * @param {Request} [params.request]
     * @param {Localization} [params.localization]
     * @param {Function} cb
     */
    ErrorFormatters.html = function(params, cb) {
        if (params.errorCount > 1) {
            
            //we know we've hit a recursive error situation.  Bail out
            return cb(
                null,
                '<html><body><h2>Whoops! Something unexpected happened.</h2><br/><pre>' +
                params.error.stack +
                '</pre></body></html>'
            );
        }
        
        //let the default error controller handle it.
        var code = params.error.code || 500;
        var ErrorController  = null;
        var paths = [
            path.join(pb.config.docRoot, 'plugins', params.activeTheme, 'controllers/error', code + '.js'),
            path.join(pb.config.docRoot, 'plugins', params.activeTheme, 'controllers/error/index.js'),
            path.join(pb.config.docRoot, 'controllers/error_controller.js')
        ];
        for (var i = 0; i < paths.length; i++) {
            if (failedControllerPaths[paths[i]]) {
                //we've seen it and it didn't exist or had a syntax error.  Moving on!
                continue;
            }
            
            //attempt to load the controller
            try {
                ErrorController = require(paths[i])(pb);
                break;
            }
            catch(e){
                
                //we failed so make sure don't do that again...
                failedControllerPaths[paths[i]];
            }
        };
        var cInstance = new ErrorController();
        var context = {
            pathVars: {},
            cInstance: cInstance,
            themeRoute: {},
            activeTheme: params.activeTheme,
            initParams: {
                error: params.error
            }
        };
        params.reqHandler.doRender(context);
    };
    
    /**
     * Serializes an error as XML
     * @static
     * @method html
     * @param {Object} params
     * @param {String} params.mime The MIME type of the format to render
     * @param {Error} params.error The error to be rendered
     * @param {Request} [params.request]
     * @param {Localization} [params.localization]
     * @param {Function} cb
     */
    ErrorFormatters.xml = function(params, cb) {
        
        var xmlObj = function(key, obj) {
            var xml = '<'+HtmlEncoder.htmlEncode(key)+'>'
            util.forEach(obj, function(val, key) {
                
                if (util.isArray(val)) {
                    xml += xmlArray(key, val);
                }
                else if (util.isObject(val)) {
                    xml += xmlObj(key, val);
                }
                else {
                    xml += '<'+HtmlEncoder.htmlEncode(key)+'>' + HtmlEncoder.htmlEncode(val + '') + '</'+HtmlEncoder.htmlEncode(key)+'>';
                }
            });
            xml += '</'+HtmlEncoder.htmlEncode(key)+'>';
            return xml;
        };
        var xmlArray = function(key, obj) {
            var xml = '';
            util.forEach(obj, function(val, i) {
                
                if (util.isArray(val)) {
                    xml += xmlArray(key+'_'+i, val);
                }
                else if (util.isObject(val)) {
                    xml += xmlObj(key, val);
                }
                else {
                    xml += '<'+HtmlEncoder.htmlEncode(key)+'>' + HtmlEncoder.htmlEncode(val + '') + '</'+HtmlEncoder.htmlEncode(key)+'>';
                }
            });
            return xml;
        };
        var xmlPrimitive = function(key, val) {
            return '<'+HtmlEncoder.htmlEncode(key)+'>' + HtmlEncoder.htmlEncode(val + '') + '</'+HtmlEncoder.htmlEncode(key)+'>';
        };
        cb(
            null,
            xmlObj('error', convertToObject(params))
        );
    };
    
    /**
     * Registers a function to be mapped to a given MIME type.  The function 
     * will be expected to serialize any given Error to the format specified by 
     * the MIME type
     * @static
     * @method register
     * @param {String} mime The mime type to register the provider for
     * @param {Function} A function that takes two parameters.  The first is an 
     * object that provides the error and the second parameter is the callback.
     * @return {Boolean} TRUE when the provider was registered, FALSE if not
     */
    ErrorFormatters.register = function(mime, formatterFunction) {
        if (!util.isString(mime) || !util.isFunction(formatterFunction)) {
            return false;
        }
        MIME_MAP[mime] = formatterFunction;
        return true;
    };
    
    /**
     * Unregisters the provider for the given MIME type.  If a default MIME 
     * type is specified the current formatter will be unregistered and set to 
     * the default implementation
     * @static
     * @method unregister
     * @param {String} mime The MIME type to unregister
     * @return {Boolean} TRUE when the provider was found and unregistered, 
     * FALSE if not
     */
    ErrorFormatters.unregister = function(mime) {
        if (util.isFunction(MIME_MAP[mime])) {
            delete MIME_MAP[mime];
            
            //set the defaults back if we have them
            if (util.isFunction(DEFAULTS[mime])) {
                MIME_MAP[mime] = DEFAULTS[mime];
            }
            return true;
        }
        return false;
    };
    
    /**
     * Formats an error for the provided MIME type
     * @static
     * @method formatForMime
     * @param {Object} params
     * @param {String} params.mime The MIME type of the format to render
     * @param {Error} params.error The error to be rendered
     * @param {Request} [params.request]
     * @param {Localization} [params.localization]
     * @param {Function} cb
     */
    ErrorFormatters.formatForMime = function(params, cb) {
        if (!util.isObject(params)) {
            return cb(new Error('The params parameter must be an object'));
        }
        else if (!util.isString(params.mime)) {
            return cb(new Error('The params.mime parameter must be a string'));
        }
        else if (!util.isError(params.error)) {
            return cb(new Error('The params.error parameter must be an Error'));
        }
        
        //find the formatter, fall back to HTML if not provided
        var mime      = params.mime;
        var formatter = MIME_MAP[mime];
        if (util.isNullOrUndefined(formatter)) {
            mime      = DEFAULT_MIME;
            formatter = MIME_MAP[mime];
        }
        
        //execute the formatter
        formatter(params, function(err, content) {
            cb(
                err, 
                {
                    mime: mime,
                    content: content
                }
            );
        });
    };
    
    /**
     * Retrieves the formatter for the specified MIME type
     * @static
     * @method get
     * @param {String} mime
     * @return {Function} formatter for the specified MIME. 'undefined' if does 
     * not exist.
     */
    ErrorFormatters.get = function(mime) {
        return MIME_MAP[mime];
    };
         
    /**
     * Contains the default mapping of MIME type to function that will serialize 
     * the error to that format
     * @private
     * @static
     * @property DEFAULTS
     * @type {Object}
     */
    var DEFAULTS = Object.freeze({
        'application/json': ErrorFormatters.json,
        'text/json': ErrorFormatters.json,
        'text/html': ErrorFormatters.html,
        'application/xml': ErrorFormatters.xml,
        'text/xml': ErrorFormatters.xml,
    });
            
    /**
     * Contains the mapping of MIME type to function that will serialize the 
     * error to that format
     * @private
     * @static
     * @property MIME_MAP
     * @type {Object}
     */
    var MIME_MAP = util.merge(DEFAULTS, {});

    return ErrorFormatters;
};
