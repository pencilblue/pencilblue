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
        if(!userIsAuthorized({logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            output({content: ''});
            return;
        }
        
        session.section = 'topics';
        session.subsection = 'import_topics';
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/content/topics/import_topics', null, null, function(data)
            {
                result = result.concat(data);
                
                var tabs =
                [
                    {
                        active: true,
                        href: '#topic_settings',
                        icon: 'file-text-o',
                        title: '^loc_LOAD_FILE^'
                    }
                ];
                
                getTabNav(tabs, function(tabNav)
                {
                    result = result.split('^tab_nav^').join(tabNav);
                
                    displayErrorOrSuccess(session, result, function(newSession, newResult)
                    {
                        session = newSession;
                        result = newResult;
                        
                        editSession(request, session, [], function(data)
                        {
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'topics'], result)});
                        });
                    });
                });
            });
        });
    });
}
