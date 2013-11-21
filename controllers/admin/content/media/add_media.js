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
        
        session.section = 'media';
        session.subsection = 'add_media';
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/content/media/add_media', null, null, function(data)
            {
                result = result.concat(data);
                
                displayErrorOrSuccess(session, result, function(newSession, newResult)
                {
                    session = newSession;
                    result = newResult;
                    
                    instance.getTopicOptions(function(topicsList)
                    {
                        result = result.split('^topic_options^').join(topicsList);
                    
                        editSession(request, session, [], function(data)
                        {
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'media'], result)});
                        });
                    });
                });
            });
        });
    });
}

this.getTopicOptions = function(output)
{
    var topicsList = '';
    var topicTemplate = '';
    
    getDBObjectsWithValues({object_type: 'topic'}, function(data)
    {
        var topics = data;
        
        // Case insensitive sort
        topics.sort(function(a, b)
        {
            var x = a['name'].toLowerCase();
            var y = b['name'].toLowerCase();
        
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
        
        getHTMLTemplate('admin/content/articles/new_article/topic', null, null, function(data)
        {
            topicTemplate = data;

            for(var i = 0; i < topics.length; i++)
            {
                var topicsListElement = topicTemplate.split('^topic_id^').join(topics[i]._id.toString());
                topicsListElement = topicsListElement.split('^topic_name^').join(topics[i].name);
                topicsList = topicsList.concat(topicsListElement);
            }
            
            output(topicsList);
        });
    });
}
