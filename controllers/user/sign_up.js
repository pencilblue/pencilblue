/*

    Interface for importing topics CSV
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    
    getSession(request, function(session)
    {    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('user/sign_up', '^loc_SIGN_UP^', null, function(data)
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
