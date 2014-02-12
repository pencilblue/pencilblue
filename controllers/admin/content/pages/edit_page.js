/*

    Interface for editing an page
    
    @author Blake Callens <blake.callens@gmail.com>
    @copyright PencilBlue 2014, All rights reserved

*/

this.init = function(request, output)
{
    var result = '';
    var instance = this;
    
    getSession(request, function(session)
    {
        if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_WRITER}))
        {
            output({redirect: pb.config.siteRoot + '/admin'});
            return;
        }
        
        var get = getQueryParameters(request);
        if(!get['id'])
        {
            output({redirect: pb.config.siteRoot + '/admin/content/pages/manage_pages'});
            return;
        }
        
        getDBObjectsWithValues({object_type: 'page', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                output({redirect: pb.config.siteRoot + '/admin/content/pages/manage_pages'});
                return;
            }
            
            var page = data[0];
            page.page_media = page.page_media.join(',');
            page.page_topics = page.page_topics.join(',');
            session = setFormFieldValues(page, session);
            
            if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
            {
                if(!session.user._id.equals(ObjectID(page.author)))
                {
                    output({redirect: pb.config.siteRoot + '/admin/content/pages/manage_pages'});
                    return;
                }
            }
    
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/content/pages/edit_page', page.headline, null, function(data)
                {
                    result = result.concat(data);
                    result = result.split('^page_id^').join(get['id']);
                    
                    var tabs =
                    [
                        {
                            active: true,
                            href: '#content',
                            icon: 'quote-left',
                            title: '^loc_CONTENT^'
                        },
                        {
                            href: '#media',
                            icon: 'camera',
                            title: '^loc_MEDIA^'
                        },
                        {
                            href: '#topics_dnd',
                            icon: 'tags',
                            title: '^loc_TOPICS^'
                        },
                        {
                            href: '#meta_data',
                            icon: 'tasks',
                            title: '^loc_META_DATA^'
                        }
                    ];
                    
                    var pages = require('../pages');
                    
                    pages.getTemplates(function(templates)
                    {
                        getDBObjectsWithValues({object_type: 'topic', $orderby: {name: 1}}, function(topics)
                        {
                            pages.getMedia(function(media)
                            {                            
                                prepareFormReturns(session, result, function(newSession, newResult)
                                {
                                    session = newSession;
                                    result = newResult;
                                    
                                    var pills = pages.getPillNavOptions('edit_page');
                                    pills.unshift(
                                    {
                                        name: 'manage_pages',
                                        title: page.headline,
                                        icon: 'chevron-left',
                                        href: '/admin/content/pages/manage_pages'
                                    });
                                    
                                    result = result.concat(getAngularController(
                                    {
                                        navigation: getAdminNavigation(session, ['content', 'pages']),
                                        pills: pills,
                                        tabs: tabs,
                                        templates: templates,
                                        topics: topics, 
                                        media: media
                                    }, [], 'initMediaPagination();initTopicsPagination()'));
                        
                                    editSession(request, session, [], function(data)
                                    {
                                        output({content: localize(['admin', 'pages', 'articles', 'media'], result)});
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};
