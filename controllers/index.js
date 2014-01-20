/*

    Index page of the pencilblue theme
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getDBObjectsWithValues({object_type: 'user'}, function(data)
    {
        if(data.length == 0)
        {
            output({redirect: pb.config.siteRoot + '/setup'});
            return;
        }
    
        getSession(request, function(session)
        {
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('index', '^loc_HOME^', null, function(data)
                {
                    result = result.concat(data);
                                    
                    require('../include/theme/top_menu').getTopMenu(session, function(themeSettings, navigation, accountButtons)
                    {
                        var section = request.pencilblue_section || null;
                        var topic = request.pencilblue_topic || null;
                        var article = request.pencilblue_article || null;
                        var page = request.pencilblue_page || null;
                        
                        require('../include/theme/articles').getArticles(section, topic, article, page, function(articles)
                        {
                            require('../include/theme/media').getCarousel(themeSettings.carousel_media, result, '^carousel^', 'index_carousel', function(newResult)
                            {
                                getContentSettings(function(contentSettings)
                                {
                                    require('../include/theme/comments').getCommentsTemplate(contentSettings, function(commentsTemplate)
                                    {
                                        result = result.split('^comments^').join(commentsTemplate);
                                        
                                        var loggedIn = false;
                                        if(session.user)
                                        {
                                            loggedIn = true;
                                        }
                                
                                        result = result.concat(getAngularController(
                                        {
                                            navigation: navigation,
                                            contentSettings: contentSettings,
                                            loggedIn: loggedIn,
                                            themeSettings: themeSettings,
                                            accountButtons: accountButtons,
                                            articles: articles,
                                            trustHTML: 'function(string){return $sce.trustAsHtml(string);}'
                                        }, ['ngSanitize']));
                                    
                                        getHTMLTemplate('footer', null, null, function(data)
                                        {
                                            result = result.concat(data);
                                            output({cookie: getSessionCookie(session), content: localize(['pencilblue_generic', 'timestamp'], result)});
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
}
