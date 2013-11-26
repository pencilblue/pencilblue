this.init = function(request, output)
{
    var instance = this;

    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({redirect: SITE_ROOT});
            return;
        }
        
        var get = getQueryParameters(request);
        
        if(message = checkForRequiredParameters(get, ['id']))
        {
            formError(request, session, message, '/admin/content/media', output);
            return;
        }
        if(session['user']['admin'] < 1)
        {
            formError(request, session, '^loc_INSUFFICIENT_CREDENTIALS^', '/admin/content/media', output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'media', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                formError(request, session, '^loc_ERROR_SAVING^', '/admin/content/media', output);
                return;
            }
            
            deleteMatchingDBObjects({object_type: 'media', _id: ObjectID(get['id'])}, function(success)
            {
                session.success = '^loc_MEDIA_DELETED^';
                
                editSession(request, session, [], function(data)
                {        
                    output({redirect: SITE_ROOT + '/admin/content/media'});
                });
            });
        });
    });
}
