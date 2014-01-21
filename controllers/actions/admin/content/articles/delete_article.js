/*

    Deletes articles
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/

this.init = function(request, output)
{
    var instance = this;

    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/articles/manage_articles', output);
            return;
        }
        
        var get = getQueryParameters(request);
        
        if(message = checkForRequiredParameters(get, ['id']))
        {
            formError(request, session, message, '/admin/content/articles/manage_articles', output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'article', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/articles/manage_articles', output);
                return;
            }
            
            var article = data[0];
            
            deleteMatchingDBObjects({object_type: 'article', _id: ObjectID(get['id'])}, function(success)
            {
                session.success = article.headline + ' ^loc_DELETED^';
                
                editSession(request, session, [], function(data)
                {        
                    output({redirect: pb.config.siteRoot + '/admin/content/articles/manage_articles'});
                });
            });
        });
    });
}
