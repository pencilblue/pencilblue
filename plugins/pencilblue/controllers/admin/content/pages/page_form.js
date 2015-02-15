/*
	Copyright (C) 2015  PencilBlue, LLC

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

//dependencies
var async = require('async');

/**
* Interface for creating and editing pages
*/
function PageFormController(){}

//inheritance
util.inherits(PageFormController, pb.BaseController);

PageFormController.prototype.render = function(cb) {
	var self  = this;
	var vars = this.pathVars;
	this.vars = vars;

	self.gatherData(vars, function(err, results){
		if(util.isError(err)) {
			throw err;
		}
		else if(!results.page) {
			self.reqHandler.serve404();
			return;
		}

		self.page = results.page;
		var tabs = self.getTabs();

		self.setPageName(self.page[pb.DAO.getIdField()] ? self.page.headline : self.ls.get('NEW_PAGE'));
		self.ts.registerLocal('angular_objects', new pb.TemplateValue(self.getAngularObjects(tabs, results), false));
		self.ts.load('admin/content/pages/page_form', function(err, data) {
            var result = data;
            self.checkForFormRefill(result, function(newResult) {
                result = newResult;
                cb({content: result});
            });
		});
	});
};

/**
 *
 * @method getAngularObjects
 *
 */
PageFormController.prototype.getAngularObjects = function(tabs, data) {
	if(data.page[pb.DAO.getIdField()]) {
		var media = [];
		var i, j;

		for(i = 0; i < data.page.page_media.length; i++) {
			for(j = 0; j < data.media.length; j++) {
				if(pb.DAO.areIdsEqual(data.media[j][pb.DAO.getIdField()], data.page.page_media[i])) {
					media.push(data.media[j]);
					data.media.splice(j, 1);
					break;
				}
			}
		}
		data.page.page_media = media;

		var topics = [];
		for(i = 0; i < data.page.page_topics.length; i++) {
			for(j = 0; j < data.topics.length; j++) {
				if(pb.DAO.areIdsEqual(data.topics[j][pb.DAO.getIdField()], data.page.page_topics[i])) {
					topics.push(data.topics[j]);
					data.topics.splice(j, 1);
					break;
				}
			}
		}
		data.page.page_topics = topics;
	}

	var objects = {
		navigation: pb.AdminNavigation.get(this.session, ['content', 'pages'], this.ls),
		pills: pb.AdminSubnavService.get(this.getActivePill(), this.ls, this.getActivePill(), data),
		tabs: tabs,
		templates: data.templates,
		sections: data.sections,
		topics: data.topics,
		media: data.media,
		page: data.page
	};
	return pb.js.getAngularObjects(objects);
};

/**
 * @static
 * @method getAngularObjects
 *
 */
PageFormController.getSubNavItems = function(key, ls, data) {
	return [{
		name: 'manage_pages',
		title: data.page[pb.DAO.getIdField()] ? ls.get('EDIT') + ' ' + data.page.headline : ls.get('NEW_PAGE'),
		icon: 'chevron-left',
		href: '/admin/content/pages'
	}, {
		name: 'new_page',
		title: '',
		icon: 'plus',
		href: '/admin/content/pages/new'
	}];
};

/**
 *
 * @method getActivePill
 *
 */
PageFormController.prototype.getActivePill = function() {
	return 'new_page';
};

/**
 *
 * @method gatherData
 *
 */
PageFormController.prototype.gatherData = function(vars, cb) {
	var self  = this;
	var dao   = new pb.DAO();
	var tasks = {
		templates: function(callback) {
			callback(null, pb.TemplateService.getAvailableContentTemplates());
		},

		sections: function(callback) {
			var opts = {
                select: pb.DAO.PROJECT_ALL,
                where: {
				    type: {$in: ['container', 'section']}
                },
                order: {name: pb.DAO.ASC}
			};
			dao.q('section', opts, callback);
		},

		topics: function(callback) {
            var opts = {
                select: pb.DAO.PROJECT_ALL,
                where: pb.DAO.ANYWHERE,
                order: {name: pb.DAO.ASC}
            };
			dao.q('topic', opts, callback);
		},

		media: function(callback) {
			var mservice = new pb.MediaService();
			mservice.get(callback);
		},

		page: function(callback) {
			if(!vars.id) {
				callback(null, {});
				return;
			}

			dao.loadById(vars.id, 'page', callback);
		}
	};
	async.parallelLimit(tasks, 2, cb);
};

/**
 *
 * @method getTabs
 *
 */
PageFormController.prototype.getTabs = function() {
	return [
		{
			active: 'active',
			href: '#content',
			icon: 'quote-left',
			title: this.ls.get('CONTENT')
		},
		{
			href: '#media',
			icon: 'camera',
			title: this.ls.get('MEDIA')
		},
		{
			href: '#topics_dnd',
			icon: 'tags',
			title: this.ls.get('TOPICS')
		},
		{
			href: '#seo',
			icon: 'tasks',
			title: this.ls.get('SEO')
		}
	];
};

//register admin sub-nav
pb.AdminSubnavService.registerFor('new_page', PageFormController.getSubNavItems);

//exports
module.exports = PageFormController;
