function ThemesController(){}

//dependencies
var BaseController = pb.BaseController;
var DAO            = pb.DAO;

//inheritance
util.inherits(ThemesController, BaseController);


ThemesController.prototype.render = function(cb) {
	var self = this;
	
	//get plugs with themes
	var dao = new DAO();
	dao.query('plugin', {theme: {$exists: true}}).then(function(themes) {
		if (util.isError(themes)) {
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
	                themes: themes,
	                options: options,
	                activeTheme: activeTheme
	            }, 
	            []
	        );
			
			//load the template
			//self.ts.registerLocal('angular_script', angularData);
			self.ts.load('/admin/themes/index', function(err, content) {
				
				//TODO move angular out as flag & replacement when can add option to 
				//skip the check for replacements in replacement
				content = content.replace('^angular_script^', angularData);
				cb({content: content});
			});
		});
	});
};

//exports
module.exports = ThemesController;
