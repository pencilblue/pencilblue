// Retrieve the header, body, and footer and return them to the router
this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!session['user'] || !session['user']['admin'])
        {
            output({content: ''});
            return;
        }
        
        getDBObjectsWithValues({object_type: 'media'}, function(data)
        {
            if(data.length == 0)
            {
                session.section = 'media';
                session.subsection = 'add_media';
                
                editSession(request, session, [], function(data)
                {
                    output({cookie: getSessionCookie(session), content: getJSTag('window.location = "' + SITE_ROOT + '/admin/content/media";')});
                });
                
                return;
            }
            
            var media = data;
        
            session.section = 'media';
            session.subsection = 'manage_media';
        
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/content/media/manage_media', null, null, function(data)
                {
                    result = result.concat(data);
                    
                    displayErrorOrSuccess(session, result, function(newSession, newResult)
                    {
                        session = newSession;
                        result = newResult;
                        
                        instance.getMedia(media, function(mediaList)
                        {
                            result = result.split('^media^').join(mediaList);
                            
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

this.getMedia = function(media, output)
{
    output('');
}
