/*

    Interface for importing topics CSV
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    
    getContentSettings(function(contentSettings)
    {
        if(!contentSettings.allow_comments)
        {
            output({redirect: pb.config.siteRoot});
            return;
        }   
        
        getSession(request, function(session)
        {    
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('user/sign_up', '^loc_SIGN_UP^', null, function(data)
                {
                    result = result.concat(data);
                    
                    getDBObjectsWithValues({object_type: 'pencilblue_theme_settings'}, function(data)
                    {
                        if(data.length == 0)
                        {
                            result = result.split('^site_logo^').join(pb.config.siteRoot + '/img/logo_menu.png');
                        }
                        else
                        {
                            result = result.split('^site_logo^').join(data[0].site_logo);
                        }
                    
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
        });
    });
}
