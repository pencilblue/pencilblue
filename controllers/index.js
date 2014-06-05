/**
 * Index page of the pencilblue theme
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Index(){}

//dependencies
var TopMenu        = require('../include/theme/top_menu');
var Media          = require('../include/theme/media');
var Comments       = require('../include/theme/comments');
var ArticleService = require('../include/service/entities/article_service').ArticleService;

//inheritance
util.inherits(Index, pb.BaseController);

Index.prototype.render = function(cb) {
	var self = this;
    
    //determine and execute the proper call
    var section = self.req.pencilblue_section || null;
    var topic   = self.req.pencilblue_topic   || null;
    var article = self.req.pencilblue_article || null;
    var page    = self.req.pencilblue_page    || null;

    pb.content.getSettings(function(err, contentSettings) {
        self.gatherData(function(err, data) {                         
            ArticleService.getMetaInfo(data.content[0], function(metaKeywords, metaDescription, metaTitle) {
                
                self.ts.reprocess = false;
                self.ts.registerLocal('meta_keywords', metaKeywords);
                self.ts.registerLocal('meta_desc', metaDescription);
                self.ts.registerLocal('meta_title', metaTitle);
                self.ts.registerLocal('meta_lang', localizationLanguage);
                self.ts.registerLocal('current_url', self.req.url);
                self.ts.registerLocal('navigation', data.nav.navigation);
                self.ts.registerLocal('account_buttons', data.nav.accountButtons);
                self.ts.registerLocal('infinite_scroll', function(flag, cb) {
                    if(article || page) {
                        cb(null, '');
                    }
                    else {
                        var infiniteScrollScript = pb.js.includeJS('/js/infinite_article_scroll.js');
                        if(section) {
                            infiniteScrollScript += pb.js.getJSTag('var infiniteScrollSection = "' + section + '";');
                        }
                        else if(topic) {
                            infiniteScrollScript += pb.js.getJSTag('var infiniteScrollTopic = "' + topic + '";');
                        }
                        cb(null, infiniteScrollScript);
                    }
                });
                self.ts.registerLocal('articles', function(flag, cb) {
                    var tasks = pb.utils.getTasks(data.content, function(content, i) {
                        return function(callback) {
                            if (i >= contentSettings.articles_per_page) {//TODO, limit articles in query, not throug hackery
                                callback(null, '');   
                                return;
                            }
                            self.renderContent(content[i], contentSettings, data.nav.themeSettings, i, callback);
                        };
                    });
                    async.parallel(tasks, function(err, result) {
                        cb(err, result.join(''));
                    });
                });
                self.ts.registerLocal('page_name', function(flag, cb) {
                     self.getContentSpecificPageName(util.isArray(data.content) && data.content.length > 0 ? data.content[0] : null, cb);
                });
                
                self.getTemplate(data.content, function(err, template) {
                    if (util.isError(err)) {
                        throw err;
                    }
                    
                    self.ts.load(template, function(err, result) {
                        if (util.isError(err)) {
                            throw err;
                        }

                        var loggedIn = pb.security.isAuthenticated(self.session);
                        var commentingUser = loggedIn ? Comments.getCommentingUser(self.session.authentication.user) : null;
                        var objects = {
                            contentSettings: contentSettings,
                            loggedIn: loggedIn,
                            commentingUser: commentingUser,
                            themeSettings: data.nav.themeSettings,
                            articles: data.content,
                            trustHTML: 'function(string){return $sce.trustAsHtml(string);}'
                        };
                        var angularData = pb.js.getAngularController(objects, ['ngSanitize']);
                        result = result.concat(angularData);
                        cb({content: result});
                    });
                });
            });
        });
    });
};


Index.prototype.getTemplate = function(content, cb) {
    
    //check if we should just use whatever default there is.
    //this could fall back to an active theme or the default pencilblue theme.
    if (!this.req.pencilblue_article && !this.req.pencilblue_page) {
        cb(null, 'index');
        return;
    }
    
    //now we are dealing with a single page or article. the template will be 
    //judged based off the article's preference.
    var uidAndTemplate = content.template;
    
    //when no template is specified or is empty we no that the article has no 
    //preference and we can fall back on the default (index).  We depend on the 
    //template service to determine who has priority based on the active theme 
    //then defaulting back to pencilblue.
    if (!pb.validation.validateNonEmptyStr(uidAndTemplate, true)) {
        pb.log.silly("ContentController: No template specified, defaulting to index.");
        cb(null, "index");
        return;
    }
    
    //we now know that the template was specified.  We have to split the value 
    //to extract the intended theme and the template path
    var pieces = uidAndTemplate.split('|');
    
    //for backward compatibility we let the template service determine where to 
    //find the template when no template is specified.  This mostly catches the 
    //default case of "index"
    if (pieces.length === 1) {
        
        pb.log.silly("ContentController: No theme specified, Template Service will delegate [%s]", pieces[0]);
        cb(null, pieces[0]);
        return;
    }
    else if (pieces.length <= 0) {
        
        //shit's broke. This should never be the case but better safe than sorry
        cb(new Error("The content's template property provided an invalid value of ["+content.template+']'), null);
        return;
    }
    
    //the theme is specified, we ensure that the theme is installed and 
    //initialized otherwise we let the template service figure out how to 
    //delegate.
    if (!pb.PluginService.isActivePlugin(pieces[0])) {
        pb.log.silly("ContentController: Theme [%s] is not active, Template Service will delegate [%s]", pieces[0], pieces[1]);
        cb(null, pieces[1]);
        return;
    }
    
    //the theme is OK. We don't gaurantee that the template is on the disk but we can testify that it SHOULD.  We set the 
    //prioritized theme for the template service.
    pb.log.silly("ContentController: Prioritizing Theme [%s] for template [%s]", pieces[0], pieces[1]);
    this.ts.setTheme(pieces[0]);
    cb(null, pieces[1]);
};


Index.prototype.gatherData = function(cb) {
    var self  = this;
    var tasks = {
        
        //navigation
        nav: function(callback) {
            self.getNavigation(function(themeSettings, navigation, accountButtons) {
                callback(null, {themeSettings: themeSettings, navigation: navigation, accountButtons: accountButtons}); 
            });
        },
        
        //articles, pages, etc.
        content: function(callback) {
            self.loadContent(callback);
        },
    };
    async.parallel(tasks, cb);
};

Index.prototype.loadContent = function(articleCallback) {
    
    var section = this.req.pencilblue_section || null;
    var topic   = this.req.pencilblue_topic   || null;
    var article = this.req.pencilblue_article || null;
    var page    = this.req.pencilblue_page    || null;
    
    var service = new ArticleService();
    if(this.req.pencilblue_preview) {
        if(this.req.pencilblue_preview == page || article) {
            if(page) {
                service.setContentType('page');
            }
            var where = pb.DAO.getIDWhere(page || article);
            where.draft = {$gte: 0};
            service.find(where, articleCallback);
        }
        else {
            service.find({}, articleCallback);
        }
    }
    else if(section) {
        service.findBySection(section, articleCallback);
    }
    else if(topic) {
        service.findByTopic(topic, articleCallback);
    }
    else if(article) {
        service.findById(article, articleCallback);
    }
    else if(page) {
        service.setContentType('page');
        service.findById(page, articleCallback);
    }
    else{
        service.find({}, articleCallback);
    }
};

Index.prototype.renderContent = function(content, contentSettings, themeSettings, index, cb) {
    var self = this;
    var ats  = new pb.TemplateService(this.ls);
    self.ts.reprocess = false;
    ats.registerLocal('article_headline', '<a href="' + pb.UrlService.urlJoin('/article/', content.url) + '">' + content.headline + '</a>');
    ats.registerLocal('article_headline_nolink', content.headline);
    ats.registerLocal('article_subheading', content.subheading ? content.subheading : '');
    ats.registerLocal('article_subheading_display', content.subheading ? '' : 'display:none;');
    ats.registerLocal('article_id', content._id.toString());
    ats.registerLocal('article_index', index);
    ats.registerLocal('article_timestamp', contentSettings.display_timestamp ? content.timestamp : '');
    ats.registerLocal('article_timestamp_display', contentSettings.display_timestamp ? '' : 'display:none;');
    ats.registerLocal('article_layout', content.layout);
    ats.registerLocal('article_url', content.url);
    ats.registerLocal('display_byline', contentSettings.display_bylines ? '' : 'display:none;');
    ats.registerLocal('author_photo', content.author_photo ? content.author_photo : '');
    ats.registerLocal('author_photo_display', content.author_photo ? '' : 'display:none;');
    ats.registerLocal('author_name', content.author_name ? content.author_name : '');
    ats.registerLocal('author_position', content.author_position ? content.author_position : '');
    ats.registerLocal('media_body_style', content.media_body_style ? content.media_body_style : '');
    ats.registerLocal('comments', function(flag, cb) {
       if (content.object_type === 'page' || !contentSettings.allow_comments) {
           cb(null, '');
           return;
       }
        
        self.renderComments(content, ats, cb);
    });
    ats.load('elements/article', cb);
};

Index.prototype.renderComments = function(content, ts, cb) {
    var self           = this;
    var commentingUser = null;
    if(pb.security.isAuthenticated(this.session)) {
        commentingUser = Comments.getCommentingUser(this.session.authentication.user);
    }
    
    ts.registerLocal('user_photo', function(flag, cb) {
        if (commentingUser) {
            cb(null, commentingUser.photo ? commentingUser.photo : '');
        }
        else {
            cb(null, '');
        }
    });
    ts.registerLocal('user_position', function(flag, cb) {
        if (commentingUser && util.isArray(commentingUser.position) && commentingUser.position.length > 0) {
            cb(null, ', ' + commentingUser.position);
        }
        else {
            cb(null, '');
        }
    });
    ts.registerLocal('user_name', commentingUser ? commentingUser.name : '');
    ts.registerLocal('display_submit', commentingUser ? 'block' : 'none');
    ts.registerLocal('display_login', commentingUser ? 'none' : 'block');
    ts.registerLocal('comments_length', util.isArray(content.comments) ? content.comments.length : 0);
    ts.registerLocal('individual_comments', function(flag, cb) {
        if (!util.isArray(content.comments) || content.comments.length == 0) {
            cb(null, '');
            return;
        }

        var tasks = pb.utils.getTasks(content.comments, function(comments, i) {
            return function(callback) {
                self.renderComment(comments[i], callback);
            };
        });
        async.parallel(tasks, function(err, results) {
            cb(err, results.join(''));
        });
    });
    ts.load('elements/comments', cb);
};

Index.prototype.renderComment = function(comment, cb) {

    var cts = new pb.TemplateService(this.ls);
    cts.reprocess = false;
    cts.registerLocal('commenter_photo', comment.commenter_photo ? comment.commenter_photo : '');
    cts.registerLocal('display_photo', comment.commenter_photo ? 'block' : 'none');
    cts.registerLocal('commenter_name', comment.commenter_name);
    cts.registerLocal('commenter_position', comment.commenter_position ? ', ' + comment.commenter_position : '');
    cts.registerLocal('content', comment.content);
    cts.registerLocal('timestamp', comment.timestamp);
    cts.load('elements/comments/comment', cb);
};

Index.prototype.getContentSpecificPageName = function(content, cb) {
    

    if(this.req.pencilblue_article || this.req.pencilblue_page) {
        cb(null, content.headline + ' | ' + pb.config.siteName);
    }
    else if(this.req.pencilblue_section || this.req.pencilblue_topic) {
        
        var objType = this.req.pencilblue_section ? 'section' : 'topic';
        var dao     = new pb.DAO();
        dao.loadById(this.req.pencilblue_section, objType, function(err, obj) {
            if(util.isError(err) || obj === null) {
                cb(null, pb.config.siteName);
                return;
            }

            cb(null, obj.name + ' | ' + pb.config.siteName);
        });
    }
    else {
        cb(null, pb.config.siteName);
    }
};

Index.prototype.getNavigation = function(cb) {
    TopMenu.getTopMenu(this.session, this.ls, function(themeSettings, navigation, accountButtons) {
        TopMenu.getBootstrapNav(navigation, accountButtons, function(navigation, accountButtons) {
            cb(themeSettings, navigation, accountButtons);
        });
    });
};

//exports
module.exports = Index;
