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
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
        {
            output({content: ''});
            return;
        }
        
        var searchObject = {object_type: 'page', $orderby: {headline: 1}};
        
        getDBObjectsWithValues(searchObject, function(data)
        {
            if(data.length == 0)
            {
                session.section = 'pages';
                session.subsection = 'new_page';
                
                editSession(request, session, [], function(data)
                {
                    output({cookie: getSessionCookie(session), content: getJSTag('window.location = "' + pb.config.siteRoot + '/admin/content/pages";')});
                });
                
                return;
            }
            
            session.section = 'pages';
            session.subsection = 'manage_pages';
            
            var pages = data;
            
            getHTMLTemplate('admin/content/pages/manage_pages', null, null, function(data)
            {
                result = result.concat(data);
                
                displayErrorOrSuccess(session, result, function(newSession, newResult)
                {
                    session = newSession;
                    result = newResult;
                    
                    instance.getPageAuthors(pages, function(newPages)
                    {
                        pages = newPages;
                    
                        result = result.concat(getJSTag('$(document).ready(function(){setPages(' + JSON.stringify(pages) + ')})'));
                        
                        editSession(request, session, [], function(data)
                        {
                            output({cookie: getSessionCookie(session), content: localize(['admin', 'pages'], result)});
                        });
                    });
                });
            });
        });
    });
}

this.getPageAuthors = function(pages, output)
{
    var instance = this;

    this.getPageAuthor = function(index)
    {
        if(index >= pages.length)
        {
            output(pages);
            return;
        }
    
        getDBObjectsWithValues({object_type: 'user', _id: ObjectID(pages[index].author)}, function(data)
        {
            if(data.length == 0)
            {
                pages.splice(index, 1);
                instance.getPageAuthor(index);
                return;
            }
            
            pages[index].author_name = data[0].first_name + ' ' + data[0].last_name;
            
            index++;
            instance.getPageAuthor(index);
        });
    }
    
    instance.getPageAuthor(0);
}
