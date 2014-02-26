/**
 * Index page of the pencilblue theme
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Index(){}

//dependencies
var TopMenu  = require('../include/theme/top_menu');
var Articles = require('../include/theme/articles');
var Media    = require('../include/theme/media');
var Comments = require('../include/theme/comments');

//inheritance
util.inherits(Index, pb.BaseController);

Index.prototype.render = function(cb) {
	var self = this;
	
	pb.templates.load('index', '^loc_HOME^', null, function(data) {
        var result = data;
                        
        TopMenu.getTopMenu(self.session, function(themeSettings, navigation, accountButtons) {

            var section = self.req.pencilblue_section || null;
            var topic   = self.req.pencilblue_topic   || null;
            var article = self.req.pencilblue_article || null;
            var page    = self.req.pencilblue_page    || null;
            
            Articles.getArticles(section, topic, article, page, function(articles) {
                Media.getCarousel(themeSettings.carousel_media, result, '^carousel^', 'index_carousel', function(newResult) {
                    pb.content.getSettings(function(err, contentSettings) {
                        
                        Comments.getCommentsTemplate(contentSettings, function(commentsTemplate) {
                            result = result.split('^comments^').join(commentsTemplate);
                            
                            var loggedIn       = false;
                            var commentingUser = {};
                            if(self.session.user) {
                                loggedIn       = true;
                                commentingUser = Comments.getCommentingUser(session.user);
                            }
                    
                            var objects = {
                                navigation: navigation,
                                contentSettings: contentSettings,
                                loggedIn: loggedIn,
                                commentingUser: commentingUser,
                                themeSettings: themeSettings,
                                accountButtons: accountButtons,
                                articles: articles,
                                trustHTML: 'function(string){return $sce.trustAsHtml(string);}'
                            };
                            var angularData = pb.js.getAngularController(objects, ['ngSanitize']);
                            result = result.concat(angularData);
                        
                            pb.templates.load('footer', null, null, function(data) {
                                
                            	result = result.concat(data);
                                var content = self.localizationService.localize(['pencilblue_generic', 'timestamp'], result);
                                cb({content: content});
                            });
                        });
                    });
                });
            });
        });
    });
};

//exports
module.exports = Index;
