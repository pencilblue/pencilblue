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

//dependencies
var async = require('async');

/**
* Interface for adding and editing media
* @class MediaForm
* @constructor
*/
function MediaForm(){}

//inheritance
util.inherits(MediaForm, pb.BaseController);

//statics
var SUB_NAV_KEY = 'media_form';

/**
* @method render
* @param {Function} cb
*/
MediaForm.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;

	this.gatherData(vars, function(err, data) {
		if (util.isError(err)) {
			throw err;
		}
		else if(!data.media) {
			self.reqHandler.serve404();
			return;
		}

		self.media = data.media;
		data.media.media_topics = self.getMediaTopics(data);
		data.pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, self.media);
		var angularObjects = pb.js.getAngularObjects(data);

		self.setPageName(self.media._id ? self.media.name : self.ls.get('NEW_MEDIA'));
		self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
		self.ts.load('admin/content/media/media_form', function(err, result) {
			cb({content: result});
		});
	});
	return;
};

MediaForm.prototype.gatherData = function(vars, cb) {
	var self = this;
	var dao = new pb.DAO();

	var tasks = {
		tabs: function(callback) {
			var tabs   =
			[{
				active: 'active',
				href: '#media_upload',
				icon: 'film',
				title: self.ls.get('LINK_OR_UPLOAD')
			},
			{
				href: '#topics_dnd',
				icon: 'tags',
				title: self.ls.get('TOPICS')
			}];
			callback(null, tabs);
		},

		navigation: function(callback) {
			callback(null, pb.AdminNavigation.get(self.session, ['content', 'media'], self.ls));
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
			if(!vars.id) {
				return callback(null, {media_topics: []});
			}

			var mservice = new pb.MediaService();
			mservice.loadById(vars.id, callback);
		}
	};
	async.series(tasks, cb);
};

MediaForm.prototype.getMediaTopics = function(data) {
	var topics = [];
	if(!data.media.media_topics) {
		return topics;
	}

	for(i = 0; i < data.media.media_topics.length; i++) {
		for(j = 0; j < data.topics.length; j++) {
			if(pb.DAO.areIdsEqual(data.topics[j][pb.DAO.getIdField()], data.media.media_topics[i])) {
				topics.push(data.topics[j]);
				data.topics.splice(j, 1);
				break;
			}
		}
	}

	return topics;
};

MediaForm.getSubNavItems = function(key, ls, data) {
	return [{
		name: 'manage_media',
		title: data._id ? ls.get('EDIT') + ' ' + data.name : ls.get('NEW_MEDIA'),
		icon: 'chevron-left',
		href: '/admin/content/media'
	}, {
		name: 'new_media',
		title: '',
		icon: 'plus',
		href: '/admin/content/media/new'
	}];
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, MediaForm.getSubNavItems);

//exports
module.exports = MediaForm;
