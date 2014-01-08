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
                getHTMLTemplate('head', 'Home', null, function(data)
                {
                    require('../include/top_menu').setTopMenu(session, data, function(siteSettings, headLayout)
                    {
                        result = result.concat(headLayout);
                        getHTMLTemplate('index', null, null, function(data)
                        {
                            result = result.concat(data);
                            
                            var section = request.pencilblue_section || null;
                            var topic = request.pencilblue_topic || null;
                            var article = request.pencilblue_article || null;
                            var page = request.pencilblue_page || null;
                            
                            require('../include/articles').getArticles(section, topic, article, page, function(articles)
                            {
                                result = result.split('^articles^').join(articles);
                                
                                require('../include/media').getCarousel(siteSettings.carousel_media, result, '^carousel^', 'index_carousel', function(newResult)
                                {
                                    result = newResult;
                                
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
}
