/**
 * Manage custom objects via a table
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ManageObjectTypes() {}

//inheritance
util.inherits(ManageObjectTypes, pb.BaseController);

ManageObjectTypes.prototype.render = function(cb) {
	var self = this;
	var dao  = new pb.DAO();
	dao.query('custom_object_type', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL).then(function(customObjectTypes) {
		if (util.isError(customObjectTypes)) {
			//TODO handle this
		}
		
		//none to manage
        if(customObjectTypes.length == 0) {                
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/new_object_type'));
            return;
        }
        
        customObjectTypes = ManageObjectTypes.setFieldTypesUsed(self, customObjectTypes);
        
        //currently, mongo cannot do case-insensitive sorts.  We do it manually 
        //until a solution for https://jira.mongodb.org/browse/SERVER-90 is merged.
        customObjectTypes.sort(function(a, b) {
            var x = a['name'].toLowerCase();
            var y = b['name'].toLowerCase();
        
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    
        self.setPageName(self.ls.get('MANAGE_OBJECT_TYPES'));
        self.ts.load('admin/content/custom_objects/manage_object_types', function(err, result) {

            var pills = require('../custom_objects').getPillNavOptions('manage_object_types');
            pills.unshift(
            {
                name: 'manage_object_types',
                title: self.ls.get('MANAGE_OBJECT_TYPES'),
                icon: 'refresh',
                href: '/admin/content/custom_objects/manage_object_types'
            });
            
            result = result.concat(pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls),
                pills: pills,
                customObjectTypes: customObjectTypes
            }, [], 'initObjectTypesPagination()'));
            
            cb({content: result});
        });
    });
};

ManageObjectTypes.setFieldTypesUsed = function(self, customObjectTypes) {
    // Make the list of field types used in each custom object type, for display
    for(var i = 0; i < customObjectTypes.length; i++) {
        var fieldTypesUsed = [];
        for(var key in customObjectTypes[i].fields) {
            var fieldType = customObjectTypes[i].fields[key].field_type;
            switch(fieldType) {
                case 'text':
                    fieldTypesUsed.push(self.ls.get('TEXT'));
                    break;
                case 'number':
                    fieldTypesUsed.push(self.ls.get('NUMBER'));
                    break;
                case 'date':
                    fieldTypesUsed.push(self.ls.get('DATE'));
                    break;
                case 'peer_object':
                    fieldTypesUsed.push(self.ls.get('PEER_OBJECT'));
                    break;
                case 'child_objects':
                    fieldTypesUsed.push(self.ls.get('CHILD_OBJECTS'));
                    break;
                default:
                    break;
            }
        }
        
        for(var j = 0; j < fieldTypesUsed.length; j++) {
            for(var s = j + 1; s < fieldTypesUsed.length; s++) {
                if(fieldTypesUsed[s] == fieldTypesUsed[j]) {
                    fieldTypesUsed.splice(s, 1);
                    s--;
                }
            }
        }
        
        customObjectTypes[i].fieldTypesUsed = fieldTypesUsed.join(', ');
    }
    
    return customObjectTypes;
};

//exports
module.exports = ManageObjectTypes;
