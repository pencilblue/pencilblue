/*

    Interface for managing the site's topics via drag and drop
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            output({redirect: pb.config.siteRoot + '/admin'});
            return;
        }
        
        getDBObjectsWithValues({object_type: 'topic'}, function(data)
        {
            if(data.length == 0)
            {                
                output({redirect: pb.config.siteRoot + '/admin/content/topics/new_topic'});
                return;
            }
            
            var topics = data;
            
            topics.sort(function(a, b)
            {
                var x = a['name'].toLowerCase();
                var y = b['name'].toLowerCase();
            
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/content/topics/manage_topics', '^loc_MANAGE_TOPICS^', null, function(data)
                {
                    result = result.concat(data);
                    
                    getAdminNavigation(session, ['content', 'topics'], function(data)
                    {
                        result = result.split('^admin_nav^').join(data);
                        
                        displayErrorOrSuccess(session, result, function(newSession, newResult)
                        {
                            session = newSession;
                            result = newResult;
                            
                            result = result.concat(getAngularController({pills: require('../topics').getPillNavOptions('manage_topics'), topics: topics}));
                            
                            editSession(request, session, [], function(data)
                            {
                                output({cookie: getSessionCookie(session), content: localize(['admin', 'topics'], result)});
                            });
                        });
                    });
                });
            });
        });
    });
}
