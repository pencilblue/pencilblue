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
        
        getDBObjectsWithValues({object_type: 'topic'}, function(data)
        {
            if(data.length == 0)
            {
                session.section = 'topics';
                session.subsection = 'new_topic';
                
                editSession(request, session, [], function(data)
                {
                    output({cookie: getSessionCookie(session), content: getJSTag('window.location = "' + SITE_ROOT + '/admin/content/topics";')});
                });
                
                return;
            }
            
            var topics = data;
        
            session.section = 'topics';
            session.subsection = 'manage_topics';
        
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/content/topics/manage_topics', null, null, function(data)
                {
                    result = result.concat(data);
                    
                    displayErrorOrSuccess(session, result, function(newSession, newResult)
                    {
                        session = newSession;
                        result = newResult;
                        
                        instance.getTopics(topics, function(topicsArray, topicsList)
                        {
                            result = result.split('^topics_array^').join(JSON.stringify(topicsArray));
                            result = result.split('^topics^').join(topicsList);
                            
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

this.getTopics = function(topics, output)
{
    var topicsArray = [];
    var topicsList = '';
    var topicTemplate = '';
    
    // Case insensitive sort
    topics.sort(function(a, b)
    {
        var x = a['name'].toLowerCase();
        var y = b['name'].toLowerCase();
    
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    
    getHTMLTemplate('admin/content/topics/manage_topics/topic', null, null, function(data)
    {
        topicTemplate = data;

        for(var i = 0; i < topics.length; i++)
        {
            var topicsListElement = topicTemplate.split('^topic_id^').join(topics[i]._id.toString());
            topicsListElement = topicsListElement.split('^topic_name^').join(topics[i].name);
            topicsList = topicsList.concat(topicsListElement);
            
            topicsArray.push({uid: topics[i]._id.toString(), name: topics[i].name});
        }
        
        output(topicsArray, topicsList);
    });
}
