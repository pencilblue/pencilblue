/**
 * 
 * @copyright PencilBlue, LLC 2014 All Rights Reserved
 */
function Logout(){}

//inheritance
util.inherits(Logout, pb.BaseController);

Logout.prototype.render = function(cb) {
	var self = this;
	pb.session.end(this.session, function(err, result){
		
		//clear the cookie
		var cookies      = new Cookies(self.req, self.res);
		var cookie       = pb.SessionHandler.getSessionCookie(self.session);
		cookie.expires   = new Date();
		cookie.overwrite = true;
		cookies.set(pb.SessionHandler.COOKIE_NAME, null, cookie);

		//send redirect
		cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot));
	});
};

//exports
module.exports = Logout;