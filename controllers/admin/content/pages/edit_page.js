/*

    Interface for editing an page
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            output({content: ''});
            return;
        }
        
        var get = getQueryParameters(request);
        if(!get['id'])
        {
            instance.invalidIDProvided(request, session, output);
            return;
        }
        
        getDBObjectsWithValues({object_type: 'page', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                instance.invalidIDProvided(request, session, output);
                return;
            }
            
            var page = data[0];
            page.page_media = page.page_media.join(',');
            page.page_topics = page.page_topics.join(',');
            session = setFormFieldValues(page, session);
            
            if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
            {
                if(!session.user._id.equals(ObjectID(page.author)))
                {
                    instance.invalidIDProvided(request, session, output);
                    return;
                }
            }
    
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/content/pages/edit_page', null, null, function(data)
                {
                    result = result.concat(data);
                    result = result.split('^page_id^').join(get['id']);
                    
                    var tabs =
                    [
                        {
                            active: true,
                            href: '#content',
                            icon: 'quote-left',
                            title: '^loc_CONTENT^'
                        },
                        {
                            href: '#media',
                            icon: 'camera',
                            title: '^loc_MEDIA^'
                        },
                        {
                            href: '#topics_dnd',
                            icon: 'tags',
                            title: '^loc_TOPICS^'
                        },
                        {
                            href: '#meta_data',
                            icon: 'tasks',
                            title: '^loc_META_DATA^'
                        }
                    ];
                    
                    getTabNav(tabs, function(tabNav)
                    {
                        result = result.split('^tab_nav^').join(tabNav);
                        
                        instance.getTemplateOptions(function(templatesList)
                        {
                            result = result.split('^template_options^').join(templatesList);
                                
                            instance.getTopicOptions(function(topicsList)
                            {
                                result = result.split('^topic_options^').join(topicsList);
                                
                                instance.getMediaOptions(function(mediaList)
                                {
                                    result = result.split('^media_options^').join(mediaList);
                            
                                    prepareFormReturns(session, result, function(newSession, newResult)
                                    {
                                        session = newSession;
                                        result = newResult;
                                        
                                        editSession(request, session, [], function(data)
                                        {
                                            output({content: localize(['admin', 'pages', 'media'], result)});
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};

this.getTemplateOptions = function(output)
{
    availableTemplates = [];
    templatesList = '';
    
    getDBObjectsWithValues({object_type: 'setting', key: 'active_theme'}, function(data)
    {
        if(data.length > 0)
        {
            fs.readdir(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/controllers', function(error, directory)
            {
                for(var file in directory)
                {
                    if(directory[file].indexOf('.js') > -1)
                    {
                        var templateFile = directory[file].substr(0, directory[file].indexOf('.js'));
                        availableTemplates.push(templateFile);
                    }
                }
                
                fs.readFile(DOCUMENT_ROOT + '/plugins/themes/' + data[0]['value'] + '/details.json', function(error, data)
                {
                    if(error)
                    {
                        output('');
                        return;
                    }
                    
                    var details = JSON.parse(data);
                    for(var i = 0; i < details.content_templates.length; i++)
                    {
                        for(var j = 0; j < availableTemplates.length; j++)
                        {
                            if(details.content_templates[i].file == availableTemplates[j])
                            {
                                templatesList = templatesList.concat('<option value="' + details.content_templates[i].file + '">' + details.content_templates[i].name + '</option>');
                            }
                        }
                    }
                    
                    output(templatesList);
                });
            });
        }
        else
        {
            output('');
        }
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

this.getMediaOptions = function(output)
{
    var mediaList = '';
    var mediaTemplate = '';
    var instance = this;
    
    getDBObjectsWithValues({object_type: 'media'}, function(data)
    {
        var media = data;
        
        // Case insensitive sort
        media.sort(function(a, b)
        {
            var x = a['name'].toLowerCase();
            var y = b['name'].toLowerCase();
        
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
        
        getHTMLTemplate('admin/content/articles/new_article/media', null, null, function(data)
        {
            mediaItemTemplate = data;
        
            for(var i = 0; i < media.length; i++)
            {
                var mediaItemElement = mediaItemTemplate.split('^media_id^').join(media[i]._id.toString());
                mediaItemElement = mediaItemElement.split('^media_name^').join(media[i].name);
                mediaItemElement = mediaItemElement.split('^media_icon^').join(instance.getMediaIcon(media[i].media_type));
                mediaItemElement = mediaItemElement.split('^media_caption^').join(media[i].caption);
                mediaItemElement = mediaItemElement.split('^media_link^').join(instance.getMediaLink(media[i].media_type, media[i].location, media[i].is_file));
                mediaItemElement = mediaItemElement.split('^spacer^').join((i % 4 == 3) ? '<div class="spacer"></div>' : '');
                
                mediaList = mediaList.concat(mediaItemElement);
            }
        
            output(mediaList);
        });
    });
}

this.getMediaIcon = function(mediaType)
{
    var iconID = '';

    switch(mediaType)
    {
        case 'image':
            iconID = 'picture-o';
            break;
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
            iconID = 'film';
            break;
        case 'youtube':
            iconID = 'youtube';
            break;
        case 'vimeo':
            iconID = 'vimeo-square';
            break;
        case 'daily_motion':
            iconID = 'play-circle-o';
            break;
        default:
            iconID = 'question';
            break;
    }
    
    return '<i class="fa fa-' + iconID + '"></i>';
}

this.getMediaLink = function(mediaType, mediaLocation, isFile)
{
    switch(mediaType)
    {
        case 'youtube':
            return 'http://youtube.com/watch/?v=' + mediaLocation;
        case 'vimeo':
            return 'http://vimeo.com/' + mediaLocation;
        case 'daily_motion':
            return 'http://dailymotion.com/video/' + mediaLocation;
        case 'image':
        case 'video/mp4':
        case 'video/webm':
        case 'video/ogg':
        default:
            if(isFile)
            {
                return pb.config.siteRoot + mediaLocation;
            }
            return mediaLocation;
    }
}

this.invalidIDProvided = function(request, session, output)
{
    session.section = 'pages';
    session.subsection = 'manage_pages';
    editSession(request, session, [], function(data)
    {
        output({cookie: getSessionCookie(session), content: getJSTag('window.location = "' + pb.config.siteRoot + '/admin/content/pages";')});
    });
}
