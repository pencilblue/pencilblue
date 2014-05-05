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

SecurityService.getRoleNames = function(ls) {
	var map = SecurityService.getRoleToDisplayNameMap(ls);
	return pb.utils.hashToArray(map);
};

SecurityService.getRoleToDisplayNameMap = function(ls) {
	if (ls && typeof ls.get === 'function') {
		return {
			'ACCESS_USER': ls.get('ACCESS_USER'),
	        'ACCESS_WRITER': ls.get('ACCESS_WRITER'),
	        'ACCESS_EDITOR': ls.get('ACCESS_EDITOR'),
	        'ACCESS_MANAGING_EDITOR': ls.get('ACCESS_MANAGING_EDITOR'),
	        'ACCESS_ADMINISTRATOR': ls.get('ACCESS_ADMINISTRATOR'),
		};
	}
	return null;
};

SecurityService.getRoleName = function(accessLevel) {
	switch(accessLevel) {
	case ACCESS_USER:
		return 'ACCESS_USER';
	case ACCESS_WRITER:
		return 'ACCESS_WRITER';
	case ACCESS_EDITOR:
		return 'ACCESS_EDITOR';
	case ACCESS_MANAGING_EDITOR:
		return 'ACCESS_MANAGING_EDITOR';
	case ACCESS_ADMINISTRATOR:
		return 'ACCESS_ADMINISTRATOR';
	default:
		throw new PBError(util.format("An invalid access level [%s] was provided", accessLevel), 500);
	}
};


SecurityService.authenticateSession = function(session, options, authenticator, cb){
	var doAuthentication = function(session, options, authenticator, cb) {
		authenticator.authenticate(options, function(err, user) {
			if (util.isError(err) || user == null) {
				cb(err, user);
				return;
			}
			
			//remove password from data to be cached
	        delete user.password;
	        
	        //build out session object
	        user.permissions                   = pb.PluginService.getPermissionsForRole(user.admin);
	        session.authentication.user        = user;
	        session.authentication.user_id     = user._id.toString();
	        session.authentication.admin_level = user.admin;
	        cb(null, user);
		});
	};
	doAuthentication(session, options, authenticator, cb);
};


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
