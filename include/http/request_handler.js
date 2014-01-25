/**
 * req Handler - Responsible for processing a single req by delegating it to the correct controllers
 */
function RequestHandler(server, req, resp){
	this.server = server;
	this.req    = req;
	this.resp   = resp;
}

RequestHandler.prototype.handleRequest = function(){
	
	this.req.headers[pb.SessionHandler.COOKIE_HEADER] = RequestHandler.parseCookies(this.req);
    
//    if(this.req.headers['content-type'])
//    {
//        if(this.req.headers['content-type'].indexOf('multipart/form-data') > -1)
//        {
//            return;
//        }
//    }
    
    this.req.on('data', function(chunk) {
        if (typeof this.req.headers['post'] == 'undefined') {
            req.headers['post'] = '';
        }
        req.headers['post'] += chunk;
    });
    
    // /include/router.js
    var route = new Route(this.req, this.resp);
    route.route();
    
    //open session
    //pb.sesson.open(req, this.onSessionRetrieved);
};

RequestHandler.prototype.onSessionRetrieved = function(err, result) {
	if (err) {
		this.onErrorOccurred(err);
		return;
	}
	
	//check for core code
};

RequestHandler.prototype.onErrorOccurred = function(err){
	var error = new PBError("Failed to open a session", 500);
	error.setSource(err);
	throw error;
};

RequestHandler.parseCookies = function(req){
	
	var parsedCookies = {};
	if (req.headers.cookie) {
        
        var cookieParameters = req.headers.cookie.split(';');
        for(var i = 0; i < cookieParameters.length; i++)  {
            
        	var keyVal = cookieParameters[i].split('=');
            parsedCookies[keyVal[0]] = keyVal[1];
        }
	}
    return parsedCookies;
};

module.exports.RequestHandler = RequestHandler;