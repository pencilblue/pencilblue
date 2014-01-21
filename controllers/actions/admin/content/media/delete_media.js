/*

    Deletes media
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var instance = this;

    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/media/manage_media', output);
            return;
        }
        
        var get = getQueryParameters(request);
        
        if(message = checkForRequiredParameters(get, ['id']))
        {
            formError(request, session, message, '/admin/content/media/manage_media', output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'media', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/media/manage_media', output);
                return;
            }
            
            var media = data[0];
            
            deleteMatchingDBObjects({object_type: 'media', _id: ObjectID(get['id'])}, function(success)
            {
                session.success = media.name + ' ^loc_DELETED^';
                
                editSession(request, session, [], function(data)
                {        
                    output({redirect: pb.config.siteRoot + '/admin/content/media/manage_media'});
                });
            });
        });
    });
}
