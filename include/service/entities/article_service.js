/*
	Copyright (C) 2014  PencilBlue, LLC

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * Reusable service classes to be called from controllers
 *
 * @module Services
 */

/**
 * Service calls for individual entities in the system
 *
 * @module Services
 * @submodule Entities
 */

/**
 * Retrieves articles and pages
 *
 * @class ArticleService
 * @constructor
 *
 */
function ArticleService(){
	this.object_type = 'article';
}

//dependencies
var Media = require('../../theme/media');

/**
 * Rerieves the content type
 *
 * @method getContentType
 * @return {String} Content type
 */
ArticleService.prototype.getContentType = function() {
	return this.object_type;
};

/**
 * Sets the content type (article, page)
 *
 * @method setContentType
 * @param {String} type The content type
 */
ArticleService.prototype.setContentType = function(type) {
	this.object_type = type;
};

/**
 * Finds an article or page by Id
 *
 * @method findById
 * @param {String}   articleId The article's object Id
 * @param {Function} cb        Callback function
 */
ArticleService.prototype.findById = function(articleId, cb) {
	this.find(pb.DAO.getIDWhere(articleId), cb);
};

/**
 * Finds articles by section
 *
 * @method findBySection
 * @param {String}   sectionId The section's object Id
 * @param {Function} cb        Callback function
 */
ArticleService.prototype.findBySection = function(sectionId, cb) {
	this.find({article_sections: sectionId}, cb);
};

/**
 * Finds articles and pages by topic
 *
 * @method findByTopic
 * @param {[type]}   topicId The topic's object Id
 * @param {Function} cb      Callback function
 */
ArticleService.prototype.findByTopic = function(topicId, cb) {
	this.find({article_topics: topicId}, cb);
};

/**
 * Finds articles and pages matching criteria
 *
 * @method find
 * @param  {Object}   where Key value pair object
 * @param  {Function} cb    Callback function
 */
ArticleService.prototype.find = function(where,  cb) {
	var self = this;

	var dao   = new pb.DAO();
	var order = [['publish_date', pb.DAO.DESC], ['created', pb.DAO.DESC]];
	if(!where.publish_date) {
		where.publish_date = {$lt: new Date()};
	}
	if(!where.draft) {
	    where.draft = {$ne: 1};
    }
	dao.query(this.getContentType(), where, pb.DAO.SELECT_ALL, order).then(function(articles) {
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

/**
 * Retrieves data necessary for displaying an articles and appends it to the
 * article object
 *
 * @method processArticleForDisplay
 * @param {[type]}   article         The artice to process
 * @param {[type]}   authors         Available authors retrieved from the database
 * @param {[type]}   contentSettings Content settings to use for processing
 * @param {Function} cb              Callback function
 */
ArticleService.prototype.processArticleForDisplay = function(article, authors, contentSettings, cb) {
	var self = this;

	if (this.getContentType() === 'article') {
		if(contentSettings.display_bylines) {

	        for(var j = 0; j < authors.length; j++) {

	        	if(authors[j]._id.equals(ObjectID(article.author))) {
	                if(authors[j].photo && contentSettings.display_author_photo) {
	                    article.author_photo     = authors[j].photo;
	                    article.media_body_style = '';
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

        	var where = {article: article._id.toString()};
	        var order = {created: pb.DAO.ASC};
	        var dao   = new pb.DAO();
	        dao.query('comment', where, pb.DAO.PROJECT_ALL, order).then(function(comments) {
	            if(util.isError(comments) || comments.length == 0) {
	                cb(null, null);
	                return;
	            }

	            self.getCommenters(comments, contentSettings, function(err, commentsWithCommenters) {
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

/**
 * Retrieves the authors of an array of articles
 *
 * @method getArticleAuthors
 * @param {Array}    articles Array of article objects
 * @param {Function} cb       Callback function
 */
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
 * Retrieves the commenters for an array of comments
 *
 * @method getCommenters
 * @param {Array}    comments        Array of comment objects
 * @param {Object}   contentSettings Content settings to use for processing
 * @param {Function} cb              Callback function
 */
ArticleService.prototype.getCommenters = function(comments, contentSettings, cb) {

	//callback for iteration to handle setting the commenter attributes
    var processComment = function(comment, commenter) {
    	comment.commenter_name = 'Anonymous';
    	comment.timestamp      = pb.content.getTimestampTextFromSettings(comment.created, contentSettings);

    	if (commenter) {
	    	comment.commenter_name = pb.users.getFormattedName(commenter);
	        if(commenter.photo) {
	        	comment.commenter_photo = commenter.photo;
	        }
	        if(commenter.position) {
	        	comment.commenter_position = commenter.position;
	        }
    	}
    };

    var processedComments = [];
    var users             = {};
    var tasks             = pb.utils.getTasks(comments, function(comments, i) {
    	return function(callback) {

    		var comment   = comments[i];
    		if (!comment.commenter || users[comment.commenter]) {

    			//user already commented so pull locally
    			processComment(comment, users[comment.commenter]);
    			processedComments.push(comment);
    			callback(null, true);
    			return;
    		}

    		//user has not already commented so load
    		var dao = new pb.DAO();
    	    dao.loadById(comment.commenter, 'user', function(err, commenter) {
    	        if(util.isError(err) || commenter == null) {
    	        	callback(null, false);
    	            return;
    	        }

    	        //process the comment
    	        users[commenter._id.toString()] = commenter;
    	        processComment(comment, commenter);
    			processedComments.push(comment);

    			callback(null, true);
    	    });
    	};
    });
    async.series(tasks, function(err, result) {
    	cb(err, processedComments);
    });
};

/**
 * Retrieves the article and byline templates
 *
 * @method getTemplates
 * @param {Function} cb Callback function
 */
ArticleService.prototype.getTemplates = function(cb) {
	var ts = new pb.TemplateService();
    ts.load('elements/article', function(err, articleTemplate) {
        ts.load('elements/article/byline', function(err, bylineTemplate) {
            cb(articleTemplate, bylineTemplate);
        });
    });
};

/**
 * Retrieves the meta info for an article or page
 *
 * @method getMetaInfo
 * @param {Object}   article An article or page object
 * @param {Function} cb      Callback function
 */
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

/**
 * Handles retrieval and injection of media in articles and pages
 *
 * @module Services
 * @class MediaLoader
 * @constructor
 * @submodule Entities
 */
function MediaLoader() {};

/**
 * Processes an article or page to insert media
 *
 * @method start
 * @param  {String}   articleLayout The HTML layout of the article or page
 * @param  {Function} cb            [description]
 */
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

/**
 * Replaces an article or page layout's ^media_display^ tag with a media embed
 * @param {String}   layout        The HTML layout of the article or page
 * @param {String}   mediaTemplate The template of the media embed
 * @param {Function} cb            Callback function
 */
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
module.exports.ArticleService = ArticleService;
module.exports.MediaLoader    = MediaLoader;
