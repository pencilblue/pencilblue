/**
 * cache_test.js
 * 
 * @author Brian Hyder <brianhyder@gmail.com>
 * @copyright PencilBlue 2014, All Rights Reserved
 */

//requires
require('../../../base_test');

module.exports = {
	
	setUp: function(cb){
		pb.dbm.getDB().then(function(result){
			var dao = new pb.DAO();
			var tasks = [
	            function(callback){
	            	dao.deleteMatching({plugin_name: 'sample'}, 'theme_settings').then(function(result){
	            		callback(null, null);
	            	});
	            },
	            function(callback){
	            	dao.deleteMatching({plugin_name: 'sample'}, 'plugin_settings').then(function(result){
	            		callback(null, null);
	            	});
	            },
	            function(callback){
	            	dao.deleteMatching({uid: 'sample'}, 'plugin').then(function(result){
	            		callback(null, null);
	            	});
	            },            
	        ];
			async.parallel(tasks, function(err, result) {
				cb();
			});
		});
	},

	tearDown: function(cb){
		pb.utils.onPromisesOk(pb.dbm.shutdown(), cb);
	},
	
	testValidateValidDetailsJSONFile: function(test) {
		
		var pluginDirName = 'sample';
		var detailsPath   = pb.PluginService.getDetailsPath(pluginDirName);
		pb.PluginService.loadDetailsFile(detailsPath, function(err, details) {
			test.ok(err == null);
			if (err != null) {
				pb.log.error("Failed to get details: " + err.stack);
			}
			
			pb.PluginService.validateDetails(details, pluginDirName, function(errs, result) {
				
				test.ok(result);
				test.ok(errs == null);
				if (errs) {
					pb.log.error(""+errs);
					if (util.isArray(errs.validationErrors)) {
						for (var i = 0; i < errs.validationErrors.length; i++) {
							pb.log.error(""+errs.validationErrors[i]);
						}
					}
				}
				test.done();
			});
		});
	},
	
	testGetServices: function(test) {
		
		var pathToPlugin = path.join(pb.PluginService.getPluginsDir(), 'sample');
		pb.PluginService.getServices(pathToPlugin, function(err, services) {
			test.equals(null, err);
			test.ok(services.text_creater != null);
			test.done();
		});
	},
	
	testGetPluginMap: function(test) {
		
		pb.plugins.getPluginMap(function(err, map) {
			test.equals(null, err);
			test.ok(map.active);
			test.ok(map.inactive);
			test.ok(map.available);
			if (map.active && map.inactive && map.available) {
				test.equals(map.active.length, 0);
				test.equals(map.inactive.length, 0);
				test.equals(map.available.length, 1);
				test.equals(map.available[0].uid, 'sample');
				test.equals(map.available[0].message, undefined);
			}
			test.done();
		});
	},
	
	testInstallAndUninstall: function(test) {
		
		pb.plugins.installPlugin('sample', function(err, result) {
			test.equals(null, err);
			test.ok(result);
			
			pb.plugins.uninstallPlugin('sample', function(err, result) {
				test.equals(err, null);
				test.ok(result);
				test.done();
			});
		});
	},
};
