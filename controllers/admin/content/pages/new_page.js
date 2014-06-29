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
 * Interface for creating a new page
 */

function NewPage(){}

//dependencies
var Media = require('../media.js');
var Pages = require('../pages');

//inheritance
util.inherits(NewPage, pb.BaseController);

//statics
var SUB_NAV_KEY = 'new_page';

NewPage.prototype.render = function(cb) {
	var self = this;

	this.setPageName(self.ls.get('NEW_PAGE'));
	self.ts.load('admin/content/pages/new_page', function(err, data) {
        var result = '' + data;
        var tabs   =
        [
            {
                active: 'active',
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
        var dao = new pb.DAO();
        dao.query('topic', pb.DAO.ANYEHERE, pb.DAO.PROJECT_ALL, {name: pb.DAO.ASC}).then(function(topics) {
            //TODO handle errors

            Media.getAll(function(media){
                self.checkForFormRefill(result, function(newResult) {
                    result = newResult;

                    var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'new_page');
                    result    = result.split('^angular_script^').join(pb.js.getAngularController(
                    {
                        navigation: pb.AdminNavigation.get(self.session, ['content', 'pages'], self.ls),
                        pills: pills,
                        tabs: tabs,
                        templates: templates,
                        topics: topics,
                        media: media
                    }, [], 'initMediaPagination();initTopicsPagination()'));

                    cb({content: result});
                });
            });
        });
    });
};

NewPage.getSubNavItems = function(key, ls, data) {
	var pills = Pages.getPillNavOptions();
	pills.unshift(
    {
        name: 'manage_pages',
        title: ls.get('NEW_PAGE'),
        icon: 'chevron-left',
        href: '/admin/content/pages/manage_pages'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, NewPage.getSubNavItems);

//exports
module.exports = NewPage;
