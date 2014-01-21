/*

    Interface for adding a new article
    
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
    
        initLocalization(request, session, function(data)
        {
            getHTMLTemplate('admin/content/articles/new_article', '^loc_NEW_ARTICLE^', null, function(data)
            {
                result = result.concat(data);
                
                var tabs =
                [
                    {
                        active: 'active',
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
                        href: '#sections_dnd',
                        icon: 'th-large',
                        title: '^loc_SECTIONS^'
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
                
                var articles = require('../articles');
                    
                articles.getTemplates(function(templates)
                {                        
                    getDBObjectsWithValues({object_type: 'section', $orderby: {name: 1}}, function(sections)
                    {
                        getDBObjectsWithValues({object_type: 'topic', $orderby: {name: 1}}, function(topics)
                        {
                            articles.getMedia(function(media)
                            {                            
                                prepareFormReturns(session, result, function(newSession, newResult)
                                {
                                    session = newSession;
                                    result = newResult;
                                    
                                    result = result.concat(getAngularController(
                                    {
                                        navigation: getAdminNavigation(session, ['content', 'articles']),
                                        pills: articles.getPillNavOptions('new_article'),
                                        tabs: tabs,
                                        templates: templates,
                                        sections: sections,
                                        topics: topics,
                                        media: media
                                    }));
                                    
                                    editSession(request, session, [], function(data)
                                    {
                                        output({content: localize(['admin', 'articles', 'media'], result)});
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
