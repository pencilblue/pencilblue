global.ACCESS_USER = 0;
global.ACCESS_WRITER = 1;
global.ACCESS_EDITOR = 2;
global.ACCESS_MANAGING_EDITOR = 3;
global.ACCESS_ADMINISTRATOR = 4;

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
}
