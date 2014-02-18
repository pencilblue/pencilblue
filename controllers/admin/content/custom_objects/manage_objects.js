/**
 * Manage custom objects via a table
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ManageObjects() {}

//inheritance
util.inherits(ManageObjects, pb.BaseController);

ManageObjects.prototype.render = function(cb) {
	var self = this;
	var get = this.query;
    if(!get['type']) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
        return;
    }
	
	var dao  = new pb.DAO();
	dao.query('custom_objects', {custom_object_type: get['type']}).then(function(customObjects) {
		if (util.isError(customObjects)) {
			//TODO handle this
		}
		
		//none to manage
        if(customObjects.length == 0) {                
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/new_object'));
            return;
        }
        
        //currently, mongo cannot do case-insensitive sorts.  We do it manually 
        //until a solution for https://jira.mongodb.org/browse/SERVER-90 is merged.
        customObjects.sort(function(a, b) {
            var x = a['name'].toLowerCase();
            var y = b['name'].toLowerCase();
        
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    
        pb.templates.load('admin/content/custom_objects/manage_object_types', '^loc_MANAGE_OBJECT_TYPES^', null, function(data) {
            var result = ''+data;
                
            self.displayErrorOrSuccess(result, function(newResult) {
                result = newResult;
                
                var pills = require('../custom_objects').getPillNavOptions('manage_object_types');
                pills.unshift(
                {
                    name: 'manage_object_types',
                    title: '^loc_MANAGE_OBJECT_TYPES^',
                    icon: 'refresh',
                    href: '/admin/content/custom_objects/manage_object_types'
                });
                
                result = result.concat(pb.js.getAngularController(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects']),
                    pills: pills,
                    customObjects: customObjects
                }, [], 'initObjectTypesPagination()'));
                
                var content = self.localizationService.localize(['admin', 'custom_objects'], result);
                cb({content: content});
            });
        });
    });
};

//exports
module.exports = ManageObjects;
