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

			var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls);

			//setup angular
			var angularData = pb.js.getAngularController(
	            {
	                navigation: pb.AdminNavigation.get(self.session, ['plugins', 'themes'], self.ls),
					pills: pills,
	                tabs: self.getTabs(),
	                themes: themes,
	                options: options,
	                activeTheme: activeTheme
	            },
	            []
	        );

			//load the template
			//self.ts.registerLocal('angular_script', angularData);
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
			self.ts.load('/admin/themes/index', function(err, content) {

				//TODO move angular out as flag & replacement when can add option to
				//skip the check for replacements in replacement
				content = content.replace('^angular_script^', angularData);
				cb({content: content});
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
