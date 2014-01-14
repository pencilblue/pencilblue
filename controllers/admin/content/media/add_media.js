/*

    Interface for adding
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            output({redirect: pb.config.siteRoot});
            return;
        }
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/content/media/add_media', '^loc_ADD_MEDIA^', null, function(data)
            {
                result = result.concat(data);
                
                getAdminNavigation(session, ['content', 'articles'], function(data)
                {
                    result = result.split('^admin_nav^').join(data);
                
                    var tabs =
                    [
                        {
                            active: 'active',
                            href: '#media_upload',
                            icon: 'film',
                            title: '^loc_LINK_OR_UPLOAD^'
                        },
                        {
                            href: '#topics_dnd',
                            icon: 'tags',
                            title: '^loc_TOPICS^'
                        }
                    ];
                    
                    displayErrorOrSuccess(session, result, function(newSession, newResult)
                    {
                        session = newSession;
                        result = newResult;
                        
                        getDBObjectsWithValues({object_type: 'topic', $orderby: {name: 1}}, function(topics)
                        {
                        
                            result = result.concat(getAngularController({pills: require('../media').getPillNavOptions('add_media'), tabs: tabs, topics: topics}));
                        
                            editSession(request, session, [], function(data)
                            {
                                output({cookie: getSessionCookie(session), content: localize(['admin', 'media'], result)});
                            });
                        });
                    });
                });
            });
        });
    });
}
