global.ACCESS_USER            = 0;
global.ACCESS_WRITER          = 1;
global.ACCESS_EDITOR          = 2;
global.ACCESS_MANAGING_EDITOR = 3;
global.ACCESS_ADMINISTRATOR   = 4;

global.userIsAuthorized = function(session, requirements)
{
    for(var key in requirements)
    {
        switch(key)
        {
            case 'logged_in':
                if(!session['user'])
                {
                    return false;
                }
                break;
            case 'admin_level':
                if(!session['user']['admin'])
                {
                    return false;
                }
                if(session['user']['admin'] < requirements[key])
                {
                    return false;
                }
                break;
            default:
                break;
        }
    }
    
    return true;
};

function SecurityService(){}

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
	var reqs = {};
	reqs[SecurityService.AUTHENTICATED] = true;
	return SecurityService.isAuthorized(session, reqs);
};

//exports
module.exports.SecurityService = SecurityService;
