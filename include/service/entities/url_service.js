/**
 * A service that provides insight into the system's routes (URLs) along with 
 * other utility functions to assist in examining and constructing URLs for 
 * clients to use for interaction with the system.
 * 
 * @class UrlService
 * @constructor
 * @module Service
 * @submodule Entities
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC. All Rights Reserved
 */
function UrlService() {}

//dependencies
var RequestHandler = pb.RequestHandler;

/**
 * Takes the URL path and tests it against registered routes.  
 * @static
 * @method exists
 * @param {string} url
 * @returns  {object} The themed route specification for the first route that 
 * matches the given URL path.  When no routes match NULL is returned.
 */
UrlService.exists = function(url){

	var themes = null;
	for (var i = 0; i < RequestHandler.storage.length; i++) {
		var curr   = RequestHandler.storage[i];
		var result = curr.expression.test(url);
		if (result) {
			themes = pb.utils.clone(curr.themes);
			break;
		}
	}
	return themes;
};

/**
 * Look at a specific content type to see if a matching URL key exists.  An 
 * optional ID can be provided to ensure that only an existing key for the 
 * object with that ID exists.
 * @method existsForType 
 * @param {object} params Contains the options for the function.  "url" 
 * (string) and "type" (string) are required.  "id" (string) is optional.
 * @param {function} cb A call back that provides two parameters: cb(Error, Boolean)
 */
UrlService.prototype.existsForType = function(params, cb) {
	var url  = params.url;
	var type = params.type;
	var id   = params.id;
	
	//validate required params
	if (!url || !type) {
		cb(new Error("The url and type parameters are required. URL=["+url+"] TYPE=["+type+"]"), false);
		return;
	}
	
	//build pattern
	if (url.charAt(0) === '/') {
		url = url.substring(1);
	}
	if (url.charAt(url.length - 1) === '/') {
		url = url.substring(0, url.length - 1);
	}
	var pattern = "^\\/{0,1}" + pb.utils.escapeRegExp(url) + "\\/{0,1}$";
	
	var where = {url: new RegExp(pattern)};
	if (id) {
		where._id = {$ne: new ObjectID(id)};
	}
	
	var dao = new pb.DAO();
	dao.count(type, where, function(err, count) {
        cb(err, count > 0);
	});
};

/**
 * Takes a variable set of arguments and joins them together to form a URL path.
 * @static
 * @method urlJoin
 * @returns a URL path
 */
UrlService.urlJoin = function() {
	var parts = [];
	for (var i = 0; i < arguments.length; i++) {
		var segment = ('' + arguments[i]).replace(/\\/g, '/');
		parts.push(segment.replace(/^\/|\/$/g, ''));
	}
	var url = parts.join('/');
	if (arguments.length > 0 && (arguments[0].charAt(0) === '/' || arguments[0].charAt(0) == '\\') && url.charAt(0) !== '/') {
		url = '/'+url;
	}
	return url;
};

/**
 * Takes a url and extracts the wild card part.  
 * @exampleFor 
 * 		If a registered route had a URL path as "/api/something/*" and a request 
 * came in for "/api/something/good/i/hope" then the function would extract the 
 * "good/i/hope" and return it.
 * @param {string} prefix
 * @param {string} url
 * @returns {string|null}The custom part of the URL
 */
UrlService.getCustomUrl = function(prefix, url) {
	var index = prefix.lastIndexOf('/');
	if (index != prefix.length - 1) {
		prefix += '/';
	}
	
	index = url.lastIndexOf(prefix);
	if (index < 0) {
		return null;
	}
	
	//check for prefix at the end
	if (index == url.length - 1) {
		return '';
	}
	return url.substring(index + 1);
};

/**
 * Determines whether a URL is external to the system by parsing the URL and 
 * then looking to see if the host matches that of the provided request.
 * @param {string} urlStr
 * @param {Request} request
 * @returns {Boolean} TRUE if the link is external to the system, FALSE if not.
 */
UrlService.isExternalUrl = function(urlStr, request) {
	var obj    = url.parse(urlStr);
    var reqUrl = null;
    
    if(!obj.host) {
        return false;
    }
    
    if(request) {
        reqUrl = url.parse(request.url);
    }
    else {
        reqUrl = url.parse(pb.config.siteRoot);
    }

    return reqUrl.host !== obj.host;
};

/**
 * Indicates if the URL is fully qualified, meaning that the URL provides the 
 * 'http' protocol at the beginning of the URL.
 * @param {string} urlStr The URL to inspect
 * @returns {Boolean} TRUE if fully qualified, FALSE if not
 */
UrlService.isFullyQualifiedUrl = function(urlStr) {
	return pb.utils.isString(urlStr) && urlStr.indexOf('http') === 0;
};

//exports
module.exports = UrlService;
