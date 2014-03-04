/**
 * EditPage - Interface for editing an page
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditPage(){}

//dependencies
var Media = require('../media.js');
var Pages = require('../pages');

//inheritance
util.inherits(EditPage, pb.BaseController);

EditPage.prototype.render = function(cb) {
	var self = this;
	
	var get = this.query;
    if(!get.id) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/pages/manage_pages'));
        return;
    }
    
    var dao = new pb.DAO();console.log('GET.ID='+get.id);
    dao.loadById(get.id, 'page', function(err, page) {
        if(page == null) {
        	cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/pages/manage_pages'));
            return;
        }
        
        page.page_media  = page.page_media.join(',');
        page.page_topics = page.page_topics.join(',');
        self.session     = self.setFormFieldValues(page);
        
        //ensure that only the author can edit page
        //TODO should global administrator be able to do this too?
        if(self.session.authentication.user_id !== page.author) {
        	self.redirect(pb.config.siteRoot + '/admin/content/pages/manage_pages', cb);
            return;
        }

        pb.templates.load('admin/content/pages/edit_page', page.headline, null, function(data) {
            var result = '' + data;
            result     = result.split('^page_id^').join(get.id);
            var tabs   =
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
                    href: '#seo',
                    icon: 'tasks',
                    title: '^loc_SEO^'
                }
            ];
            
            pb.templates.getTemplatesForActiveTheme(function(templates) {
            	
            	dao.query('topic', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(topics) {
                    
            		Media.getAll(function(media) {                            
                        
            			self.prepareFormReturns(result, function(newResult) {
                            result = newResult;
                            
                            var pills = Pages.getPillNavOptions('edit_page');
                            pills.unshift(
                            {
                                name: 'manage_pages',
                                title: page.headline,
                                icon: 'chevron-left',
                                href: '/admin/content/pages/manage_pages'
                            });
                            
                            result = result.concat(pb.js.getAngularController(
                            {
                                navigation: pb.AdminNavigation.get(self.session, ['content', 'pages']),
                                pills: pills,
                                tabs: tabs,
                                templates: templates,
                                topics: topics, 
                                media: media
                            }, [], 'initMediaPagination();initTopicsPagination()'));
                
                            var content = self.localizationService.localize(['admin', 'pages', 'articles', 'media'], result);
                            cb({content: content});
                        });
                    });
                });
            });
        });
    });
};

EditPage.init = function(request, output)
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
                            href: '#seo',
                            icon: 'tasks',
                            title: '^loc_SEO^'
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
                                    
                                    result = result.concat(pb.js.getAngularController(
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

//exports
module.exports = EditPage;
