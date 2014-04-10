function ArticleService(){
	this.object_type = 'article';
}

ArticleService.prototype.getContentType = function() {
	return this.object_type;
};

ArticleService.prototype.setContentType = function(type) {
	this.object_type = type;
};

ArticleService.prototype.findById = function(articleId, cb) {
	this.find(pb.DAO.getIDWhere(articleId), cb);
};

ArticleService.prototype.findBySection = function(sectionId, cb) {
	this.find({article_sections: sectionId}, cb);
};

ArticleService.prototype.findByTopic = function(topicId, cb) {
	this.find({article_topics: topicId}, cb);
};

ArticleService.prototype.find = function(where, cb) {
	var self = this;
	
	var dao = new pb.DAO();
	where.publish_date = {$lt: new Date()};
	dao.query(this.getContentType(), where).then(function(articles) {
		if (util.isError(articles)) {
			cb(articles, []);
			return;
		}
		else if (articles.length === 0) {
			cb(null, []);
			return;
		}
		
		//get authors
		self.getArticleAuthors(articles, function(err, authors) {
			
			pb.content.getSettings(function(err, contentSettings) {
		
				var tasks = pb.utils.getTasks(articles, function(articles, i) {
					return function(callback) {
						self.processArticleForDisplay(articles[i], authors, contentSettings, function(){
							callback(null, null);
						});
					};
				});
				async.series(tasks, function(err, results) {
					cb(err, articles);
				});
			});
		});
	});
	
};

ArticleService.prototype.processArticleForDisplay = function(article, authors, contentSettings, cb) {
	var self = this;
	
	if (this.getContentType() === 'article') {
		if(contentSettings.display_bylines) {
	        
	        for(var j = 0; j < authors.length; j++) {
	            
	        	if(authors[j]._id.equals(ObjectID(article.author))) {
	                if(authors[j].photo && contentSettings.display_author_photo) {
	                    article.author_photo = authors[j].photo;
	                }
	                else {
	                    article.media_body_style = 'height: auto';
	                }
	                
	                article.author_name     = pb.users.getFormattedName(authors[j]);
	                article.author_position = (authors[j].position && contentSettings.display_author_position) ? authors[j].position : '';
	                break;
	            }
	        }
	    }
	    
	    if(contentSettings.display_timestamp ) {
	        article.timestamp = pb.content.getTimestampTextFromSettings(
	        		article.publish_date, 
	        		contentSettings
			);
	    }
	}
    
    article.layout  = article.article_layout;
    var mediaLoader = new MediaLoader();
    mediaLoader.start(article[this.getContentType()+'_layout'], function(err, newLayout) {
        article.layout = newLayout;
        delete article.article_layout;
        
        if (self.getContentType() === 'article') {
	        
        	var where = pb.DAO.getIDWhere(article._id);
	        var order = {created: pb.DAO.ASC};
	        var dao   = new pb.DAO();
	        dao.query('comment', where, pb.DAO.PROJECT_ALL, order).then(function(comments) {
	            if(util.isError(comments) || comments.length == 0) {
	                cb(null, null);
	                return;
	            }
	        
	            instance.getCommenters(0, comments, contentSettings, function(commentsWithCommenters) {
	                article.comments = commentsWithCommenters;
	                cb(null, null);
	            });
	        });
        }
        else {
        	cb(null, null);
        }
    });
};

ArticleService.prototype.getArticleAuthors = function(articles, cb) {
	
	//gather all author IDs
	var dao = new pb.DAO();
	dao.query('user', pb.DAO.getIDInWhere(articles, 'author')).then(function(authors) {
		if (util.isError(authors)) {
			cb(authors, []);
			return;
		}
		else if (authors.length === 0) {
			cb(null, []);
			return;
		}
		cb(null, authors);
	});
};

/**
 * @private
 * @class MediaLoader
 * @constructor
 * @module Service
 * @submodule Entities
 */
function MediaLoader() {};

MediaLoader.prototype.start = function(articleLayout, cb) {
	var self = this;
	var ts   = new pb.TemplateService();
    ts.load('elements/media', function(err, mediaTemplate) {
    	
    	async.whilst(
			function() {return articleLayout.indexOf('^media_display_') >= 0;},
			function(callback) {
				self.replaceMediaTag(articleLayout, mediaTemplate, function(err, newArticleLayout) {
					articleLayout = newArticleLayout;
					callback();
				});
			},
			function(err) {
				
				async.whilst(
					function() {return articleLayout.indexOf('^carousel_display_') >= 0;},
					function(callback) {
						self.replaceCarouselTag(articleLayout, mediaTemplate, function(err, newArticleLayout) {
							articleLayout = newArticleLayout;
							callback();
						});
					},
					function(err) {
						cb(err, articleLayout);
					}
				);
			}
		);
    });
};

MediaLoader.prototype.replaceMediaTag = function(layout, mediaTemplate, cb) {
	var index = layout.indexOf('^media_display_');
	if (index == -1) {
        cb(null, layout);
        return;
    }
    
    var startIndex       = index + 15;
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
        
        cb(null, layout);
    });
};

MediaLoader.prototype.replaceCarouselTag = function(layout, mediaTemplate, cb) {
	var index = layout.indexOf('^carousel_display_');
	if(index == -1) {
        cb(null, layout);
        return;
    }
    
    var startIndex = layout.indexOf('^carousel_display_') + 18;
    var endIndex   = layout.substr(startIndex).indexOf('^');
    var mediaIDs   = layout.substr(startIndex, endIndex).split('-');
    
    var tagToReplace = layout.substr(startIndex - 18, endIndex + 19);
    var carouselID   = layout.substr(startIndex - 17, endIndex + 17);
    Media.getCarousel(mediaIDs, layout, tagToReplace, carouselID, function(newLayout) {
    	cb(null, newLayout);
    });
};

//exports
module.exports = ArticleService;