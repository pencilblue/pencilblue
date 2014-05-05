function PermissionsMapController(){}

//dependencies
var BaseController = pb.BaseController;

//inheritance
util.inherits(PermissionsMapController, BaseController);

PermissionsMapController.prototype.render = function(cb) {
	
	//setup angular
	var roleDNMap   = pb.security.getRoleToDisplayNameMap(this.ls);
	var roles       = Object.keys(roleDNMap);
	var roleDNs     = Object.keys(pb.utils.invertHash(roleDNMap));
	var map         = {};
	var rolePermMap = {};
	for (var i = 0; i < roles.length; i++) {
		
		var roleName = roles[i];
		var permMap  = pb.PluginService.getPermissionsForRole(roleName);console.log(roleName+': '+util.inspect(permMap));
		
		rolePermMap[roleName] = {};
		for (var perm in permMap) {
			map[perm] = true;
			rolePermMap[roleName][perm] = true;
		}
	}
	var permArray = Object.keys(map);
	
	var permissions = [];
	for (var i = 0; i < permArray.length; i++) {
		
		var values = [];
		for (var j = 0; j < roles.length; j++) {
			
			var value = roles[j] == 'ACCESS_ADMINISTRATOR' || rolePermMap[roles[j]][permArray[i]] !== undefined;
			values.push({val: value});
		}
		permissions.push({name: permArray[i], vals: values});
	}
	
	var angularData = pb.js.getAngularController(
        {
            navigation: pb.AdminNavigation.get(this.session, ['users', 'permissions'], this.ls),
            roles: roleDNs,
            permissions: permissions,
        }, 
        []
    );
	
	//render page
	this.setPageName(this.ls.get('PERMISSIONS'));
	this.ts.load('/admin/users/permissions', function(err, content) {
		
		//TODO move angular out as flag & replacement when can add option to 
		//skip the check for replacements in replacement
		content = content.replace('^angular_script^', angularData);
		cb({content: content});
	});
};

//exports
module.exports = PermissionsMapController;
