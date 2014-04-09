/**
 * ArticleService - 
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.
 */
function ArticleService(){}

//dependencies
var Comments = require('./comments');
var Media    = require('./media');

ArticleService.getArticles = function(section, topic, article, page, output) {
    var instance = this;

    var searchObject = {object_type: 'article', draft: {$ne: 1}};
    if(section) {
        searchObject.article_sections = section;
    }
    else if(topic) {
        searchObject.article_topics = topic;
    }
    else if(article) {
        singleItem = true;
        searchObject._id = ObjectID(article);
    }
    else if(page) {
        singleItem = true;
        searchObject.object_type = 'page';
        searchObject._id = ObjectID(page);
    }
    searchObject.publish_date = {$lt: new Date()};
    
    pb.content.getSettings(function(err, contentSettings) {
        
    	var dao = new pb.DAO();
    	dao.query(searchObject.object_type, searchObject).then(function(articles) {
            if(articles.length == 0) {
                output([]);
                return;
            }

            var authorIDs = [];  
            for(var i = 0; i < articles.length; i++) {
                authorIDs.push(new ObjectID(articles[i].author));
            }
            
            dao.query('user', pb.DAO.getIDInWhere(articles, 'author')).then(function(authors) {
                if(authors.length == 0) {
                    output([]);
                    return;
                }
                
                var subInstance = this;
                
                this.loadArticle = function(index, output) {
                    if(index >= articles.length) {
                        output(articles);
                        return;
                    }
                    
                    var article = articles[index];
                    
                    if(contentSettings.display_bylines && searchObject.object_type == 'article') {
                        
                        for(var j = 0; j < authors.length; j++) {
                            
                        	if(authors[j]._id.equals(ObjectID(articles[index].author))) {
                                if(authors[j].photo && contentSettings.display_author_photo) {
                                    article.author_photo = authors[j].photo;
                                }
                                else {
                                    article.media_body_style = 'height: auto';
                                }
                                
                                article.author_name     = pb.users.getFormattedName(authors[j]);
                                article.author_position = (authors[j].position && contentSettings.display_author_position) ? authors[j].position : '';
                            }
                        }
                    }
                    
                    if(contentSettings.display_timestamp && searchObject.object_type == 'article') {
                        article.timestamp = pb.content.getTimestampTextFromSettings(
                        		article.publish_date, 
                        		contentSettings
                		);
                    }
                    
                    switch(searchObject.object_type) {
                        case 'page':
                            article.layout = instance.loadMedia(article.page_layout, function(newLayout) {
                                article.layout = newLayout;
                                delete article.page_layout;
                                
                                index++;
                                subInstance.loadArticle(index, output);
                            });
                            break;
                        case 'article':
                        default:
                            article.layout = instance.loadMedia(article.article_layout, function(newLayout) {
                                article.layout = newLayout;
                                delete article.article_layout;
                                
                                index++;
                                
                                var where = pb.DAO.getIDWhere(article._id);
                                var order = {created: pb.DAO.ASC};
                                dao.query('comment', where, pb.DAO.PROJECT_ALL, order).then(function(comments) {
                                    if(util.isError(comments) || comments.length == 0) {
                                        subInstance.loadArticle(index, output);
                                        return;
                                    }
                                
                                    instance.getCommenters(0, comments, contentSettings, function(commentsWithCommenters) {
                                        article.comments = commentsWithCommenters;
                                        subInstance.loadArticle(index, output);
                                    });
                                });
                            });
                            break;
                    }
                };
                
                this.loadArticle(0, output);
            });
        });
    });
};

ArticleService.getTemplates = function(cb) {
	var ts = new pb.TemplateService();
    ts.load('elements/article', function(err, articleTemplate) {
        ts.load('elements/article/byline', function(err, bylineTemplate) {
            cb(articleTemplate, bylineTemplate);
        });
    });
};

ArticleService.loadMedia = function(articlesLayout, output) {
    var instance      = this;
    var mediaTemplate = '';

    this.replaceMediaTag = function(layout) {
        if(layout.indexOf('^media_display_') == -1) {
            instance.replaceCarouselTag(layout);
            return;
        }
        
        var startIndex       = layout.indexOf('^media_display_') + 15;
        var endIndex         = layout.substr(startIndex).indexOf('^');
        var mediaProperties  = layout.substr(startIndex, endIndex).split('/');
        var mediaID          = mediaProperties[0];
        var mediaStyleString = mediaProperties[1];
        
        var dao = new pb.DAO();
        dao.loadById(mediaID, 'media', function(err, data) {
            if(util.isError(err) || !data) {
                layout = layout.split(layout.substr(startIndex - 15, endIndex + 16)).join('');
            }
            else {
                var mediaEmbed = mediaTemplate.split('^media^').join(Media.getMediaEmbed(data));
                mediaEmbed     = mediaEmbed.split('^caption^').join(data.caption);
                mediaEmbed     = Media.getMediaStyle(mediaEmbed, mediaStyleString);
                
                layout = layout.split(layout.substr(startIndex - 15, endIndex + 16)).join(mediaEmbed);
            }
            
            instance.replaceMediaTag(layout);
        });
    };
    
    this.replaceCarouselTag = function(layout) {
        if(layout.indexOf('^carousel_display_') == -1) {
            output(layout);
            return;
        }
        
        var startIndex = layout.indexOf('^carousel_display_') + 18;
        var endIndex   = layout.substr(startIndex).indexOf('^');
        var mediaIDs   = layout.substr(startIndex, endIndex).split('-');
        
        var tagToReplace = layout.substr(startIndex - 18, endIndex + 19);
        var carouselID   = layout.substr(startIndex - 17, endIndex + 17);
        Media.getCarousel(mediaIDs, layout, tagToReplace, carouselID, instance.replaceCarouselTag);
    };
    
    //TODO move this out of here
    var ts = new pb.TemplateService();
    ts.load('elements/media', function(err, data) {
        mediaTemplate = data;
        instance.replaceMediaTag(articlesLayout);
    });
};

ArticleService.getCommenters = function(index, comments, contentSettings, output) {
    if(index >= comments.length) {
        output(comments);
        return;
    }

    var instance = this;
    
    var dao = new pb.DAO();
    dao.loadById(comments[index].commenter, 'user', function(err, commenter) {
        if(util.isError(err) || commenter == null) {
            comments.splice(index, 1);
            instance.getCommenters(index, comments, contentSettings, output);
            return;
        }
        
        comments[index].commenter_name = pb.users.getFormattedName(commenter);
        comments[index].timestamp      = pb.content.getTimestampTextFromSettings(comments[index].created, contentSettings);
        if(commenter.photo) {
            comments[index].commenter_photo = commenter.photo;
        }
        if(commenter.position) {
            comments[index].commenter_position = commenter.position;
        }
        
        index++;
        instance.getCommenters(index, comments, contentSettings, output);
    });
};

ArticleService.getMetaInfo = function(article, cb)
{
    if(typeof article === 'undefined')
    {
        cb('', '', '');
        return;
    }

    var keywords = article.meta_keywords || [];
    var topics = article.article_topics || article.page_topics || [];
    var instance = this;
    
    this.loadTopic = function(index)
    {
        if(index >= topics.length)
        {
            var description = '';
            if(article.meta_desc)
            {
                description = article.meta_desc;
            }
            else if(article.layout)
            {
                description = article.layout.replace(/<\/?[^>]+(>|$)/g, '').substr(0, 155);
            }
        
            cb(keywords.join(','), description, (article.seo_title.length > 0) ? article.seo_title : article.headline);
            return;
        }
        
        var dao  = new pb.DAO();
        dao.query('topic', {_id: ObjectID(topics[index])}).then(function(topics) {
            if(util.isError(topics) || topics.length == 0) {
                index++;
                instance.loadTopic(index);
                return;
            }
            
            var topicName = topics[0].name;
            var keywordMatch = false;
            
            for(var i = 0; i < keywords.length; i++) {
                if(topicName == keywords[i]) {
                    keywordMatch = true;
                    break;
                }
            }
            
            if(!keywordMatch)
            {
                keywords.push(topicName);
            }
            index++;
            instance.loadTopic(index);
        });
    };
    
    this.loadTopic(0);
};

//exports
module.exports = ArticleService;
