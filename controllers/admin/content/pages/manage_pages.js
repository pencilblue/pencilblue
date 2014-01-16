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
            output({redirect: pb.config.siteRoot + '/admin'});
            return;
        }
        
        var searchObject = {object_type: 'page', $orderby: {headline: 1}};
        
        getDBObjectsWithValues(searchObject, function(data)
        {
            if(data.length == 0)
            {
                output({redirect: pb.config.siteRoot + '/admin/content/pages/new_page'});
                return;
            }
            
            var pages = data;
            
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/content/pages/manage_pages', '^loc_MANAGE_PAGES^', null, function(data)
                {
                    result = result.concat(data);
                    
                    displayErrorOrSuccess(session, result, function(newSession, newResult)
                    {
                        session = newSession;
                        result = newResult;
                        
                        instance.getPageAuthors(pages, function(pagesWithAuthorNames)
                        {
                            result = result.concat(getAngularController(
                            {
                                navigation: getAdminNavigation(session, ['content', 'pages']),
                                pills: require('../pages').getPillNavOptions('manage_pages'),
                                pages: pagesWithAuthorNames
                            }));
                            
                            editSession(request, session, [], function(data)
                            {
                                output({cookie: getSessionCookie(session), content: localize(['admin', 'pages'], result)});
                            });
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
