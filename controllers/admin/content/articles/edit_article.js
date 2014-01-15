/*

    Interface for editing an article
    
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
            output({redirect: pb.config.siteRoot});
            return;
        }
        
        var get = getQueryParameters(request);
        if(!get['id'])
        {
            output({redirect: pb.config.siteRoot + '/admin/content/articles/manage_articles'});
            return;
        }
        
        getDBObjectsWithValues({object_type: 'article', _id: ObjectID(get['id'])}, function(data)
        {
            if(data.length == 0)
            {
                output({redirect: pb.config.siteRoot + '/admin/content/articles/manage_articles'});
                return;
            }
            
            var article = data[0];
            article.article_media = article.article_media.join(',');
            article.article_sections = article.article_sections.join(',');
            article.article_topics = article.article_topics.join(',');
            session = setFormFieldValues(article, session);
            
            if(!userIsAuthorized(session, {logged_in: true, admin_level: ACCESS_EDITOR}))
            {
                if(!session.user._id.equals(ObjectID(article.author)))
                {
                    output({redirect: pb.config.siteRoot + '/admin/content/articles/manage_articles'});
                    return;
                }
            }
    
            initLocalization(request, session, function(data)
            {
                getHTMLTemplate('admin/content/articles/edit_article', '^loc_EDIT_ARTICLE^', null, function(data)
                {
                    result = result.concat(data);
                    result = result.split('^article_id^').join(get['id']);
                    
                    getAdminNavigation(session, ['content', 'articles'], function(data)
                    {
                        result = result.split('^admin_nav^').join(data);
                    
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
                                            
                                            result = result.concat(getAngularController({pills: articles.getPillNavOptions('edit_article'), tabs: tabs, templates: templates, sections: sections, topics: topics, media: media}));
                                            
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
        });
    });
};
