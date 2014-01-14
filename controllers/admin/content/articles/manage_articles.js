/*

    Displays articles for management
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2013, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            output({redirect: pb.config.siteRoot});
            return;
        }
        
        var searchObject = {object_type: 'article', $orderby: {publish_date: 1}};
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            searchObject.author = session.user._id.toString();
        }
        
        getDBObjectsWithValues(searchObject, function(data)
        {
            if(data.length == 0)
            {
                output({redirect: pb.config.siteRoot + '/admin/content/articles/new_article'});
                return;
            }
            
            var articles = data;
            
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/content/articles/manage_articles', '^loc_MANAGE_ARTICLES^', null, function(data)
                {
                    result = result.concat(data);
                    
                    getAdminNavigation(session, ['content', 'articles'], function(data)
                    {
                        result = result.split('^admin_nav^').join(data);
                    
                        displayErrorOrSuccess(session, result, function(newSession, newResult)
                        {
                            session = newSession;
                            result = newResult;
                            
                            instance.getArticleAuthors(articles, function(articlesWithAuthorNames)
                            {                                
                                result = result.concat(getAngularController({pills: require('../articles').getPillNavOptions('manage_articles'), articles: articlesWithAuthorNames}));
                                
                                editSession(request, session, [], function(data)
                                {
                                    output({cookie: getSessionCookie(session), content: localize(['admin', 'articles'], result)});
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

this.getArticleAuthors = function(articles, output)
{
    var instance = this;

    this.getArticleAuthor = function(index)
    {
        if(index >= articles.length)
        {
            output(articles);
            return;
        }
    
        getDBObjectsWithValues({object_type: 'user', _id: ObjectID(articles[index].author)}, function(data)
        {
            if(data.length == 0)
            {
                articles.splice(index, 1);
                instance.getArticleAuthor(index);
                return;
            }
            
            articles[index].author_name = data[0].first_name + ' ' + data[0].last_name;
            
            index++;
            instance.getArticleAuthor(index);
        });
    }
    
    instance.getArticleAuthor(0);
}
