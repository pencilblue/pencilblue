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
		return [];
	}

 	pb.AdminSubnavService.registerFor(SUB_NAV_KEY, Manage.getSubNavItems);

	return Manage;
}