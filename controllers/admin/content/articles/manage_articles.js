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
            output({content: ''});
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
                session.section = 'articles';
                session.subsection = 'new_article';
                
                editSession(request, session, [], function(data)
                {
                    output({cookie: getSessionCookie(session), content: getJSTag('window.location = "' + pb.config.siteRoot + '/admin/content/articles";')});
                });
                
                return;
            }
            
            session.section = 'articles';
            session.subsection = 'manage_articles';
            
            var articles = data;
            
            getHTMLTemplate('admin/content/articles/manage_articles', null, null, function(data)
            {
                result = result.concat(data);
                
                displayErrorOrSuccess(session, result, function(newSession, newResult)
                {
                    session = newSession;
                    result = newResult;
                    
                    instance.getArticleAuthors(articles, function(newArticles)
                    {
                        articles = newArticles;
                    
                        result = result.concat(getJSTag('$(document).ready(function(){setArticles(' + JSON.stringify(articles) + ')})'));
                        
                        editSession(request, session, [], function(data)
                        {
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'articles'], result)});
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
