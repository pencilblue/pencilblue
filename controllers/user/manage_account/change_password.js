/*

    Interface for changing your password
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        initLocalization(request, session, function(data)
        {
            if(!userIsAuthorized(session, {logged_in: true}))
            {
                output({content: getJSTag('window.location = "' + pb.config.siteRoot + '"')});
                return;
            }
            
            session = setFormFieldValues(session.user, session);
            
            session.account_subsection = 'change_password';
            
            getHTMLTemplate('user/manage_account/change_password', null, null, function(data)
            {
                result = result.concat(data);
                
                displayErrorOrSuccess(session, result, function(newSession, newResult)
                {
                    session = newSession;
                    result = newResult;
                
                    editSession(request, session, [], function(data)
                    {
                        output({cookie: getSessionCookie(session), content: localize(['users'], result)});
                    });
                });
            });
        });
    });
}
