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
                    
                    instance.getArticleRows(articles, function(articleRows)
                    {
                        result = result.split('^articles^').join(articleRows);
            
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

this.getArticleRows = function(articles, output)
{

    var articleRows = '';
    var articleTemplate = '';
    
    getHTMLTemplate('admin/content/articles/manage_articles/article', null, null, function(data)
    {
        articleTemplate = data;
        var instance = this;
        
        this.getArticleRow = function(index)
        {
            if(index >= articles.length)
            {
                output(articleRows);
                return;
            }
            
            getDBObjectsWithValues({object_type: 'user', _id: ObjectID(articles[index].author)}, function(data)
            {
                if(data.length > 0)
                {
                    var articleRow = articleTemplate.split('^headline^').join(articles[index].headline);
                    articleRow = articleRow.split('^author^').join(data[0].first_name + ' ' + data[0].last_name);
                    articleRow = articleRow.split('^publish_date^').join(instance.getDatetimeText(articles[index].publish_date));
                    
                    articleRows = articleRows.concat(articleRow);
                }
                
                index++;
                instance.getArticleRow(index);
            });
        }
        
        this.getDatetimeText = function(date)
        {
            var datetime = date.getFullYear() + '-' + instance.getExtraZero(date.getMonth() + 1) + '-' + instance.getExtraZero(date.getDate()) + ' ' + instance.getExtraZero(date.getHours()) + ':' + instance.getExtraZero(date.getMinutes());
            
            return datetime;
        }

        this.getExtraZero = function(dateNumber)
        {
            if(dateNumber < 10)
            {
                dateNumber = '0' + dateNumber;
            }
            
            return dateNumber;
        }
        
        this.getArticleRow(0);
    });
}
