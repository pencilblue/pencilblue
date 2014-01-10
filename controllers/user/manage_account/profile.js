/*

    Interface for managing your profile
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_USER}))
        {
            output({content: getJSTag('window.location = "' + pb.config.siteRoot + '"')});
            return;
        }
        
        session = setFormFieldValues(session.user, session);
        
        getHTMLTemplate('user/manage_account/profile', null, null, function(data)
        {
            result = result.concat(data);
            
            editSession(request, session, [], function(data)
            {
                output({cookie: getSessionCookie(session), content: localize(['users'], result)});
            });
        });
    });
}
