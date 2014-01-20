this.getArticles = function(section, topic, article, page, output)
{
    var comments = require('./comments');
    var singleItem = false;
    var instance = this;

    var searchObject = {object_type: 'article'};
    if(section)
    {
        searchObject.article_sections = section;
    }
    else if(topic)
    {
        searchObject.article_topics = topic;
    }
    else if(article)
    {
        singleItem = true;
        searchObject._id = ObjectID(article);
    }
    else if(page)
    {
        singleItem = true;
        searchObject.object_type = 'page';
        searchObject._id = ObjectID(page);
    }
    searchObject.publish_date = {$lt: new Date()};
    
    getContentSettings(function(contentSettings)
    {
        getDBObjectsWithValues(searchObject, function(data)
        {
            if(data.length == 0)
            {
                output('^loc_NO_ARTICLES^');
                return;
            }
            
            var articles = data;
            var authorIDs = [];
                
            for(var i = 0; i < articles.length; i++)
            {
                authorIDs.push({_id: ObjectID(articles[i].author)});
            }
            
            getDBObjectsWithValues({object_type: 'user', $or: authorIDs}, function(data)
            {
                if(data.length == 0)
                {
                    output('^loc_NO_ARTICLES^');
                    return;
                }
                
                authors = data;
                
                var subInstance = this;
                
                this.loadArticle = function(index, output)
                {
                    if(index >= articles.length)
                    {
                        output(articles);
                        return;
                    }
                    
                    var article = articles[index];
                    
                    if(contentSettings.display_bylines && searchObject.object_type == 'article')
                    {
                        var byline = '';
                        for(var j = 0; j < authors.length; j++)
                        {
                            if(authors[j]._id.equals(ObjectID(articles[index].author)))
                            {
                                if(authors[j].photo && contentSettings.display_author_photo)
                                {
                                    article.author_photo = authors[j].photo;
                                }
                                else
                                {
                                    article.media_body_style = 'height: auto';
                                }
                                
                                article.author_name = (authors[j].first_name) ? authors[j].first_name + ' ' + authors[j].last_name : authors[j].username;
                                article.author_position = (authors[j].position && contentSettings.display_author_position) ? authors[j].position : '';
                            }
                        }
                    }
                    
                    if(contentSettings.display_timestamp && searchObject.object_type == 'article')
                    {
                        article.timestamp = getTimestampText(article.publish_date, contentSettings.date_format, contentSettings.display_hours_minutes, contentSettings.time_format);
                    }
                    
                    switch(searchObject.object_type)
                    {
                        case 'page':
                            article.layout = instance.loadMedia(article.page_layout, function(newLayout)
                            {
                                article.layout = newLayout;
                                delete article.page_layout;
                                
                                index++;
                                subInstance.loadArticle(index, output);
                            });
                            break;
                        case 'article':
                        default:
                            article.layout = instance.loadMedia(article.article_layout, function(newLayout)
                            {
                                article.layout = newLayout;
                                delete article.article_layout;
                                
                                index++;
                                getDBObjectsWithValues({object_type: 'comment', article: article._id.toString()}, function(comments)
                                {
                                    if(comments.length == 0)
                                    {
                                        subInstance.loadArticle(index, output);
                                        return;
                                    }
                                
                                    instance.getCommenters(0, comments, contentSettings, function(commentsWithCommenters)
                                    {
                                        article.comments = commentsWithCommenters;
                                        subInstance.loadArticle(index, output);
                                    });
                                });
                            });
                            break;
                    }
                }
                
                this.loadArticle(0, output);
            });
        });
    });
}

this.getTemplates = function(output)
{
    getHTMLTemplate('elements/article', [], [], function(articleTemplate)
    {
        getHTMLTemplate('elements/article/byline', [], [], function(bylineTemplate)
        {
            output(articleTemplate, bylineTemplate);
        });
    });
}

this.loadMedia = function(articlesLayout, output)
{
    var media = require('./media');
    var mediaTemplate = '';
    var instance = this;

    this.replaceMediaTag = function(layout)
    {
        if(layout.indexOf('^media_display_') == -1)
        {
            instance.replaceCarouselTag(layout);
            return;
        }
        
        var startIndex = layout.indexOf('^media_display_') + 15;
        var endIndex = layout.substr(startIndex).indexOf('^');
        var mediaProperties = layout.substr(startIndex, endIndex).split('/');
        var mediaID = mediaProperties[0];
        var mediaStyleString = mediaProperties[1];
        
        getDBObjectsWithValues({object_type: 'media', _id: ObjectID(mediaID)}, function(data)
        {
            if(data.length == 0)
            {
                layout = layout.split(layout.substr(startIndex - 15, endIndex + 16)).join('');
            }
            else
            {
                var mediaEmbed = mediaTemplate.split('^media^').join(media.getMediaEmbed(data[0]));
                mediaEmbed = mediaEmbed.split('^caption^').join(data[0].caption);
                mediaEmbed = media.getMediaStyle(mediaEmbed, mediaStyleString);
                
                layout = layout.split(layout.substr(startIndex - 15, endIndex + 16)).join(mediaEmbed);
            }
            
            instance.replaceMediaTag(layout);
        });
    }
    
    this.replaceCarouselTag = function(layout)
    {
        if(layout.indexOf('^carousel_display_') == -1)
        {
            output(layout);
            return;
        }
        
        var startIndex = layout.indexOf('^carousel_display_') + 18;
        var endIndex = layout.substr(startIndex).indexOf('^');
        var mediaIDs = layout.substr(startIndex, endIndex).split('-');
        
        media.getCarousel(mediaIDs, layout, layout.substr(startIndex - 18, endIndex + 19), layout.substr(startIndex - 17, endIndex + 17), instance.replaceCarouselTag);
    }
    
    getHTMLTemplate('elements/media', null, null, function(data)
    {
        mediaTemplate = data;
        instance.replaceMediaTag(articlesLayout);
    });
}

this.getCommenters = function(index, comments, contentSettings, output)
{
    if(index >= comments.length)
    {
        output(comments);
        return;
    }

    var instance = this;
    
    getDBObjectsWithValues({object_type: 'user', _id: ObjectID(comments[index].commenter)}, function(data)
    {
        if(data.length == 0)
        {
            comments.splice(index, 1);
            instance.getCommenters(index, comments, contentSettings, output);
            return;
        }
        
        var commenter = data[0];
        comments[index].commenter_name = (commenter.first_name) ? commenter.first_name + ' ' + commenter.last_name : commenter.username;
        comments[index].timestamp = getTimestampText(comments[index].created, contentSettings.date_format, contentSettings.display_hours_minutes, contentSettings.time_format);
        if(commenter.photo)
        {
            comments[index].commenter_photo = commenter.photo;
        }
        if(commenter.position)
        {
            comments[index].commenter_position = commenter.position;
        }
        
        index++;
        instance.getCommenters(index, comments, contentSettings, output);
    });
}
