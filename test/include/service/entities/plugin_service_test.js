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
		cb();
	},

	tearDown: function(cb){
		cb();
	},
	
	testValidateValidDetailsJSONFile: function(test) {
		
		var pluginDirName = 'sample';
		var detailsPath   = pb.PluginService.getDetailsPath(pluginDirName);
		pb.PluginService.loadDetailsFile(detailsPath, function(err, details) {
			test.ok(err == null);
			if (err != null) {
				pb.log.error("Failed to get details: " + err);
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
	}
};
