module.exports = function(pb) {

	var util = pb.util;

	function Manage(){}
	util.inherits(Manage, pb.BaseController);

	 var SUB_NAV_KEY = 'sites_manage';

	Manage.prototype.render = function(cb) {
		var self = this;
		var siteService = new pb.SiteService();
		siteService.getSiteMap(function(err, map) {	
			var angularObjects = pb.ClientJs.getAngularObjects({
            	navigation: pb.AdminNavigation.get(self.session, ['site_entity'], self.ls),
				pills: pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY),
            	activeSites: map.active,
            	inactiveSites: map.inactive
        	});
			self.ts.registerLocal('angular_objects', new pb.TemplateValue(angularObjects, false));
			self.ts.load('admin/sites/manage', function(err,result) {
	            cb({content: result});
	        });
		});
	}

	Manage.getSubNavItems = function(key, ls, data) {
		return [{
			name: 'manage_sites',
			title: ls.get('MANAGE_SITES'),
			icon: 'refresh',
			href: '/admin/site'
		}, {
			name: 'new_site',
			title: '',
			icon: 'plus',
			href: '/admin/sites/new'
		}];
	};

	pb.AdminSubnavService.registerFor(SUB_NAV_KEY, Manage.getSubNavItems);

	return Manage;
}