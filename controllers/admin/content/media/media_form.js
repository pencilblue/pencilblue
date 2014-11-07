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
var Media = require('../media.js');

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
		data.pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY, self.media);
		var angularObjects = pb.js.getAngularObjects(data);

		self.setPageName(self.media._id ? self.media.name : self.ls.get('NEW_MEDIA'));
		self.ts.registerLocal('angular_script','');
		self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
		self.ts.load('admin/content/media/media_form', function(err, result) {
			cb({content: result});
		});
	});
	return;
};

MediaForm.prototype.gatherData = function(vars, cb) {
	var self = this;
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

		media: function(callback) {
			if(!vars.id) {
				callback(null, {});
				return;
			}

			var mservice = new pb.MediaService();
			mservice.loadById(vars.id, function(err, media) {
				callback(err, media);
			});
		}
	};
	async.series(tasks, cb);
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
