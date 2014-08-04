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
* Interface for managing themes
*/

function ThemesController(){}

//dependencies
var BaseController = pb.BaseController;
var DAO            = pb.DAO;
var UrlService     = pb.UrlService;

//inheritance
util.inherits(ThemesController, BaseController);

//statics
var SUB_NAV_KEY = 'themes_index';

ThemesController.prototype.render = function(cb) {
	var self = this;

	//get plugs with themes
	pb.plugins.getPluginsWithThemes(function(err, themes) {
		if (util.isError(err)) {
			throw result;
		}

		//get active theme
		pb.settings.get('active_theme', function(err, activeTheme) {
			if (util.isError(err)) {
				throw err;
			}

			//add default pencil blue theme
			var options = pb.utils.copyArray(themes);
			options.push({
				uid: 'pencilblue',
				name: 'PencilBlue'

			});

			//setup angular
			var angularData = pb.js.getAngularController(
	            {
	                navigation: pb.AdminNavigation.get(self.session, ['plugins', 'themes'], self.ls),
					pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls),
	                tabs: self.getTabs(),
	                themes: themes,
	                options: options,
	                activeTheme: activeTheme
	            },
	            []
	        );

			//load the template
			self.ts.registerLocal('uploaded_image', function(flag, callback) {
				pb.settings.get('site_logo', function(err, logo) {
					if (util.isError(err)) {
						pb.log.error("ThemesController: Failed to retrieve site logo: "+err.stack);
					}

					var imgUrl = '';
					if (logo) {
						if (UrlService.isFullyQualifiedUrl(logo)) {
							imgUrl = logo;
						}
						else {
							imgUrl = UrlService.urlJoin('', logo);
						}
					}
					callback(null, imgUrl);
				});
			});
			self.ts.registerLocal('image_title', ' ');
			self.ts.registerLocal('angular_script', angularData);
			self.ts.load('/admin/themes/index', function(err, data) {
				var result = '' + data;
				cb({content: result});
			});
		});
	});
};

ThemesController.prototype.getTabs = function() {
	return [
	        {
	            active: 'active',
	            href: '#themes',
	            icon: 'magic',
	            title: this.ls.get('THEMES')
	        },
	        {
	            href: '#site_logo',
	            icon: 'picture-o',
	            title: this.ls.get('SITE_LOGO')
	        }
	    ];
};

ThemesController.getSubNavItems = function(key, ls, data) {
	return [
        {
            name: 'manage_themes',
            title: ls.get('MANAGE_THEMES'),
            icon: 'refresh',
            href: '/admin/themes'
        }
   ];
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ThemesController.getSubNavItems);

//exports
module.exports = ThemesController;
