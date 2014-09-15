/*
    Copyright (C) 2014  PencilBlue, LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

/**
 * Interface for editing a page
 */

function EditPage(){}

//dependencies
var Media = require('../media.js');
var Pages = require('../pages');

//inheritance
util.inherits(EditPage, pb.BaseController);

//statics
var SUB_NAV_KEY = 'edit_page';

EditPage.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;

    if(!vars.id) {
        self.redirect('/admin/content/pages/manage_pages', cb);
        return;
    }

    var dao = new pb.DAO();
    dao.loadById(vars.id, 'page', function(err, page) {
        if(page === null) {
        	self.redirect('/admin/content/pages/manage_pages', cb);
            return;
        }

        page.page_media  = page.page_media.join(',');
        page.page_topics = page.page_topics.join(',');
        self.setFormFieldValues(page);

        //ensure that only the author can edit page
        if(!pb.security.isAuthorized(self.session, {logged_in: true, admin_level: ACCESS_EDITOR})) {
	        if(self.session.authentication.user_id !== page.author) {
	        	self.redirect('/admin/content/pages/manage_pages', cb);
	            return;
	        }
		}

        var tabs   =
        [
            {
                active: true,
                href: '#content',
                icon: 'quote-left',
                title: self.ls.get('CONTENT')
            },
            {
                href: '#media',
                icon: 'camera',
                title: self.ls.get('MEDIA')
            },
            {
                href: '#topics_dnd',
                icon: 'tags',
                title: self.ls.get('TOPICS')
            },
            {
                href: '#seo',
                icon: 'tasks',
                title: self.ls.get('SEO')
            }
        ];

        var templates = pb.TemplateService.getAvailableContentTemplates();
        dao.query('topic', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(topics) {

            var mservice = new pb.MediaService();
            mservice.get(function(err, media) {
                if (util.isError(err)) {
                    //TODO handle error
                    pb.log.error('EditPageController: an unhandled error occurred while attempting to load all media: %s', err.stack);
                }

                var angularData = pb.js.getAngularController(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'pages'], self.ls),
                    pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'edit_page', page),
                    tabs: tabs,
                    templates: templates,
                    topics: topics,
                    media: media,
                    page: page
                }, [], 'initMediaPagination();initTopicsPagination()');

                self.setPageName(page.headline);
                self.ts.registerLocal('page_id', vars.id);
                self.ts.registerLocal('angular_script', angularData);
                self.ts.load('admin/content/pages/edit_page', function(err, data) {
                    var result = '' + data;
                    self.checkForFormRefill(result, function(newResult) {
                        result = newResult;
                        cb({content: result});
                    });
                });
            });
        });
    });
};

EditPage.getSubNavItems = function(key, ls, data) {
	var pills = Pages.getPillNavOptions();
    pills.unshift(
    {
        name: 'manage_pages',
        title: data.headline,
        icon: 'chevron-left',
        href: '/admin/content/pages/manage_pages'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, EditPage.getSubNavItems);

//exports
module.exports = EditPage;
