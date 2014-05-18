function UrlService() {}

//dependencies
var RequestHandler = pb.RequestHandler;

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

UrlService.isFullyQualifiedUrl = function(urlStr) {
	return Util.isString(urlStr) && urlStr.indexOf('http') === 0;
};

//exports
module.exports = UrlService;
