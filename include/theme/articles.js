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
        instance.getTemplates(function(articleTemplate, bylineTemplate)
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
                    
                    this.loadArticle = function(index, layout, output)
                    {
                        if(index >= articles.length)
                        {
                            output(layout);
                            return;
                        }
                    
                        var article = articleTemplate.split('^article_headline^').join((singleItem) ? articles[index].headline : '<a href="' + pb.config.siteRoot + '/' + articles[index].object_type + '/' + articles[index].url + '">' + articles[index].headline + '</a>');
                        article = article.split('^article_subheading^').join('<h3>' + articles[index].subheading + '</h3>');
                        
                        if(contentSettings.display_bylines && searchObject.object_type == 'article')
                        {
                            var byline = '';
                            for(var j = 0; j < authors.length; j++)
                            {
                                if(authors[j]._id.equals(ObjectID(articles[index].author)))
                                {
                                    if(authors[j].photo && contentSettings.display_author_photo)
                                    {
                                        byline = bylineTemplate.split('^author_photo^').join('<span class="pull-left"><img class="media-object" src="' + authors[j].photo + '" style="width: 5em"></img></span>');
                                        byline = byline.split('^media_body_style^').join('');
                                    }
                                    else
                                    {
                                        byline = bylineTemplate.split('^author_photo^').join('');
                                        byline = byline.split('^media_body_style^').join('height: auto');
                                    }
                                    byline = byline.split('^author_name^').join((authors[j].first_name) ? authors[j].first_name + ' ' + authors[j].last_name : authors[j].username);
                                        
                                    byline = byline.split('^author_position^').join((authors[j].position && contentSettings.display_author_position) ? authors[j].position : '');
                                    break;
                                }
                            }
                            
                            article = article.split('^article_byline^').join(byline);
                        }
                        else
                        {
                            article = article.split('^article_byline^').join('');
                        }
                        
                        if(contentSettings.display_timestamp && searchObject.object_type == 'article')
                        {
                            article = article.split('^article_timestamp^').join('<div class="timestamp">' + getTimestampText(articles[index].publish_date, contentSettings.date_format, contentSettings.display_hours_minutes, contentSettings.time_format) + '</div>');
                        }
                        else
                        {
                            article = article.split('^article_timestamp^').join('');
                        }
                        
                        switch(searchObject.object_type)
                        {
                            case 'page':
                                article = article.split('^article_layout^').join(articles[index].page_layout);
                                article = article.split('^comments^').join('');
                                layout = layout.concat(article)
                                index++;
                                subInstance.loadArticle(index, layout, output);
                                break;
                            case 'article':
                            default:
                                article = article.split('^article_layout^').join(articles[index].article_layout);
                                comments.getComments(articles[index], contentSettings, function(commentsLayout)
                                {
                                    article = article.split('^comments^').join(commentsLayout);
                                    layout = layout.concat(article)
                                    index++;
                                    subInstance.loadArticle(index, layout, output);
                                });
                                break;
                        }
                    }
                    
                    this.loadArticle(0, '', function(articlesLayout)
                    {
                        instance.loadMedia(articlesLayout, function(newLayout)
                        {
                            output(newLayout);
                        });
                    });
                });
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
