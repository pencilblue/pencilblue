/**
 * ManagePages - Displays articles for management
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ManagePages(){}

//inheritance
util.inherits(ManagePages, pb.BaseController);

ManagePages.prototype.render = function(cb) {
	var self = this;
	var dao  = new pb.DAO();
	
    dao.query('page', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {headline: pb.DAO.ASC}).then(function(pages) {
        if(pages.length == 0) {
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/pages/new_page'));
            return;
        }
        
        pb.templates.load('admin/content/pages/manage_pages', '^loc_MANAGE_PAGES^', null, function(data) {
            var result = '' + data;
            
            self.displayErrorOrSuccess(result, function(newResult) {
                result = newResult;
                
                self.getPageAuthors(pages, function(err, results) {
                    
                	var pills = require('../pages').getPillNavOptions('manage_pages');
                    pills.unshift(
                    {
                        name: 'manage_pages',
                        title: '^loc_MANAGE_PAGES^',
                        icon: 'refresh',
                        href: '/admin/content/pages/manage_pages'
                    });
                    
                    result = result.concat(pb.js.getAngularController(
                    {
                        navigation: pb.AdminNavigation.get(self.session, ['content', 'pages']),
                        pills: pills,
                        pages: pages
                    }, [], 'initPagesPagination()'));
                    
                    var content = self.localizationService.localize(['admin', 'pages'], result);
                    cb({content: content});
                });
            });
        });
    });
};

ManagePages.prototype.getPageAuthors = function(pages, cb) {
    var dao  = new pb.DAO();
    var tasks = pb.utils.getTasks(pages, function(pages, index){
    	return function(callback) {
    		dao.loadById('user', pages[index].author, function(err, author){
    			if (util.isError(err)) {
    				callback(err, null);
    				return;
    			}
    			pages[index].author_name = author.first_name + ' ' + author.last_name;
    			callback(null, true);
    		});
    	};
    });
    async.parallelLimit(tasks, 3, cb);
};

ManagePages.init = function(request, output)
{
    var result = '';
    
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
                        
                        ManagePages.getPageAuthors(pages, function(pagesWithAuthorNames)
                        {
                            var pills = require('../pages').getPillNavOptions('manage_pages');
                            pills.unshift(
                            {
                                name: 'manage_pages',
                                title: '^loc_MANAGE_PAGES^',
                                icon: 'refresh',
                                href: '/admin/content/pages/manage_pages'
                            });
                            
                            result = result.concat(pb.js.getAngularController(
                            {
                                navigation: getAdminNavigation(session, ['content', 'pages']),
                                pills: pills,
                                pages: pagesWithAuthorNames
                            }, [], 'initPagesPagination()'));
                            
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
};

ManagePages.getPageAuthors = function(pages, output)
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
    };
    
    instance.getPageAuthor(0);
};

//exports
module.exports = ManagePages;
