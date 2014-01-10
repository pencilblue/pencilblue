/*

    Interface for managing user profile
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true}))
        {
            output({content: getJSTag('window.location = "' + pb.config.siteRoot + '"')});
            return;
        }
        
        session = setFormFieldValues(session.user, session);
        
        session.account_subsection = 'profile';
        
        getHTMLTemplate('user/manage_account/profile', null, null, function(data)
        {
            result = result.concat(data);
            
            result = result.split('^image_title^').join('^loc_USER_PHOTO^');
            result = result.split('^uploaded_image^').join((session.user.photo) ? session.user.photo : '');
            
            prepareFormReturns(session, result, function(newSession, newResult)
            {
                session = newSession;
                result = newResult;
            
                editSession(request, session, [], function(data)
                {
                    output({cookie: getSessionCookie(session), content: localize(['users', 'media'], result)});
                });
            });
        });
    });
}
