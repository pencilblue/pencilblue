/**
 * SecurityService - 
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.
 */
function SecurityService(){}

//constants
global.ACCESS_USER            = 0;
global.ACCESS_WRITER          = 1;
global.ACCESS_EDITOR          = 2;
global.ACCESS_MANAGING_EDITOR = 3;
global.ACCESS_ADMINISTRATOR   = 4;

SecurityService.AUTHENTICATED = 'authenticated';
SecurityService.ADMIN_LEVEL   = 'admin_level';


SecurityService.isAuthorized = function(session, requirements) {
	
	//check if authentication is required
	if (requirements[SecurityService.AUTHENTICATED]) {
		if (session.authentication.user_id == null) {
			return false;
		}
	}
	
	//check for admin access level
	if (requirements[SecurityService.ADMIN_LEVEL] !== undefined) {
		if (session.authentication.admin_level < requirements[SecurityService.ADMIN_LEVEL]) {
			return false;
		}
	}
	
	//all good
	return true;
};

SecurityService.isAuthenticated = function(session) {
	if (typeof session !== 'object') {
		return false;
	}
	var reqs = {};
	reqs[SecurityService.AUTHENTICATED] = true;
	return SecurityService.isAuthorized(session, reqs);
};

/**
 * TODO Move key to settings
 * @param valStr
 * @returns
 */
SecurityService.encrypt = function(valStr) {
	var whirlpool = crypto.createHash('whirlpool');
    whirlpool.update(valStr);
    return whirlpool.digest('hex');
};

//exports
module.exports.SecurityService = SecurityService;
