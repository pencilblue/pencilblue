/*
	Copyright (C) 2015  PencilBlue, LLC

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

//dependencies
var util  = require('../../../util.js');
var async = require('async');

module.exports = function(pb) {
    
    //pb dependencies
    var DAO = pb.DAO;
    
    function ArticleRenderer(context) {}
    
    ArticleRenderer.prototype.render = function(article, context, cb) {
        if (!util.isObject(article)) {
            return cb(new Error('article parameter must be a valid object'));
        }
        else if (!util.isObject(context)) {
            return cb(new Error('context parameter must be a valid object'));
        }
        else if (!util.isObject(context.authors)) {
            return cb(new Error('context.authors parameter must be a valid hash of users'));
        }
        else if (!util.isObject(context.contentSettings)) {
            return cb(new Error('context.contentSettings parameter must be a valid hash of content settings'));
        }
        else if (isNaN(context.articleCount)) {
            return cb(new Error('context.articleCount parameter must be a valid integer greater than 0'));
        }
        
        this.formatBylines(article, context);
        this.formatTimestamp(article, context);
        this.formatLayout(article, context);
        
        var tasks = [
            util.wrapTask(this, this.formatMediaReferences, [article, context]),
            util.wrapTask(this, this.formatComments, [article, context])
        ];
        async.parallel(tasks, function(err/*, results*/) {
            cb(err, article);
        });
    };
    
    ArticleRenderer.prototype.formatBylines = function(article, context) {

        var author = context.authors[article.author];
        if (util.isNullOrUndefined(author)) {
            pb.log.warn('ArticleRenderer: Failed to find author [%s] for article [%s]', article.author, article[DAO.getIdField()]);
            return;
        }
        
        var contentSettings = context.contentSettings;
        if(author.photo && contentSettings.display_author_photo) {
            article.author_photo     = author.photo;
            article.media_body_style = '';
        }

        article.author_name     = pb.users.getFormattedName(author);
        article.author_position = '';
        if (author.position && contentSettings.display_author_position) {
            article.author_position = author.position;
        }
    };
    
    ArticleRenderer.prototype.formatTimestamp = function(article, context) {
        if(context.contentSettings.display_timestamp ) {
            article.timestamp = pb.ContentService.getTimestampTextFromSettings(
                    article.publish_date,
                    context.contentSettings
            );
        }
    };
    
    ArticleRenderer.prototype.formatLayout = function(article, context) {
        var contentSettings = context.contentSettings;
        
        if(ArticleRenderer.containsReadMoreFlag(article)) {
            this.formatLayoutForReadMore(article, context);
        }
        else if(context.readMore && contentSettings.auto_break_articles) {
            this.formatAutoBreaks(article, context);
        }
    };
    
    ArticleRenderer.prototype.formatMediaReferences = function(article, context, cb) {
        article.layout  = article.article_layout;
        var mediaLoader = new pb.MediaLoader();
        mediaLoader.start(article.layout, function(err, newLayout) {
            article.layout = newLayout;
            delete article.article_layout;
            cb(err);
        });
    };
    
    ArticleRenderer.prototype.formatComments = function(article, context, cb) {
        var self = this;
        if (!pb.ArticleService.allowComments(context.contentSettings, article)) {
            return cb(null);
        }

        var opts = {
            where: {
                article: article[pb.DAO.getIdField()] + ''
            },
            order: {
                created: pb.DAO.ASC
            }
        };
        var dao   = new pb.DAO();
        dao.q('comment', opts, function(err, comments) {
            if(util.isError(err) || comments.length == 0) {
                return cb(err);
            }

            self.getCommenters(comments, context.contentSettings, function(err, commentsWithCommenters) {
                article.comments = commentsWithCommenters;
                cb(null, null);
            });
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
    ArticleRenderer.prototype.getCommenters = function(comments, contentSettings, cb) {

        //callback for iteration to handle setting the commenter attributes
        var processComment = function(comment, commenter) {
            comment.commenter_name = 'Anonymous';
            comment.timestamp      = pb.ContentService.getTimestampTextFromSettings(comment.created, contentSettings);

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
        var tasks             = util.getTasks(comments, function(comments, i) {
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
                    users[commenter[pb.DAO.getIdField()].toString()] = commenter;
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
    
    ArticleRenderer.prototype.formatAutoBreaks = function(article, context) {
        var contentSettings = context.contentSettings;
        var breakString = '<br>';
        var tempLayout;

        // Firefox uses br and Chrome uses div in content editables.
        // We need to see which one is being used
        var brIndex = article.article_layout.indexOf('<br>');
        if(brIndex === -1) {
            brIndex = article.article_layout.indexOf('<br />');
            breakString = '<br />';
        }
        var divIndex = article.article_layout.indexOf('</div>');

        // Temporarily replace double breaks with a directive so we don't mess up the count
        if(divIndex === -1 || (brIndex > -1 && divIndex > -1 && brIndex < divIndex)) {
            tempLayout = article.article_layout.split(breakString + breakString).join(breakString + '^dbl_pgf_break^');
        }
        else {
            breakString = '</div>';
            tempLayout = article.article_layout.split('<div><br></div>').join(breakString + '^dbl_pgf_break^')
            .split('<div><br /></div>').join(breakString + '^dbl_pgf_break^');
        }

        // Split the layout by paragraphs and remove any empty indices
        var tempLayoutArray = tempLayout.split(breakString);
        for(var i = 0; i < tempLayoutArray.length; i++) {
            if(!tempLayoutArray[i].length) {
                tempLayoutArray.splice(i, 1);
                i--;
            }
        }

        // Only continue if we have more than 1 paragraph
        if(tempLayoutArray.length > 1) {
            var newLayout = '';

            // Cutoff the article at the right number of paragraphs
            for(i = 0; i < tempLayoutArray.length && i < contentSettings.auto_break_articles; i++) {
                if(i === contentSettings.auto_break_articles -1 && i != tempLayoutArray.length - 1) {
                    newLayout += tempLayoutArray[i] + '&nbsp;<span class="read_more"><a href="' + pb.config.siteRoot + '/article/' + article.url + '">' + contentSettings.read_more_text + '...</a></span>' + breakString;
                    continue;
                }
                newLayout += tempLayoutArray[i] + breakString;
            }

            if(breakString === '</div>') {
                breakString = '<div><br /></div>';
            }

            // Replace the double breaks
            newLayout = newLayout.split('^dbl_pgf_break^').join(breakString);

            article.article_layout = newLayout;
        }
    };
    
    ArticleRenderer.prototype.formatLayoutForReadMore = function(article, context) {
        
        if(context.readMore) {
            var beforeReadMore = article.article_layout.substr(0, article.article_layout.indexOf('^read_more^'));
            var path = pb.UrlService.urlJoin('/article/' + article.url);
            var link = ' <span class="read_more"><a href="' + pb.UrlService.createSystemUrl(path) + '">';
            article.article_layout = beforeReadMore + link + context.contentSettings.read_more_text + '</a></span>';
        }
        else {
            article.article_layout = article.article_layout.split('^read_more^').join('');
        }
    };
    
    ArticleRenderer.containsReadMoreFlag = function(article) {
        if (!util.isObject(article)) {
            throw new Error('The article parameter must be an object');
        }
        return article.article_layout.indexOf('^read_more^') > -1;
    };
        
    
    return ArticleRenderer;
};