/**
 * Create a new custom object
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditObjectType(){}

//dependencies
var CustomObjects = require('../custom_objects');

//inheritance
util.inherits(EditObjectType, pb.BaseController);

EditObjectType.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;	
	
    if(!vars['name']) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
        return;
    }
    
    var dao = new pb.DAO();
    dao.query('custom_object_type', {name: vars['name']}).then(function(objectTypes) {
	    if (util.isError(objectTypes)) {
		    //TODO handle this
	    }
	    
	    if(objectTypes.length == 0)
	    {
	        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
            return;
	    }
	    
	    objectType = objectTypes[0];
	
	    self.setPageName(objectType.name);
	    self.ts.registerLocal('object_type_id', objectType._id);
	    self.ts.load('admin/content/custom_objects/edit_object_type',  function(err, data) {
            var result = ''+data;
            var tabs   =
            [
                {
                    active: 'active',
                    href: '#object_settings',
                    icon: 'cog',
                    title: self.ls.get('SETTINGS')
                },
                {
                    href: '#object_fields',
                    icon: 'list-ul',
                    title: self.ls.get('FIELDS')
                }
            ];
            
            var objectTypes = ['article', 'page', 'section', 'topic', 'media', 'user'];
            
            dao.query('custom_object_type', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL).then(function(customObjectTypes) {
		        if (util.isError(customObjectTypes)) {
			        //TODO handle this
		        }
                
                // Case insensitive test for duplicate name
                for (var i =0; i < customObjectTypes.length; i++) {
                    objectTypes.push('custom:' + customObjectTypes[i].name);
                }
                    
                var pills = CustomObjects.getPillNavOptions('edit_object_type');
                pills.unshift(
                {
                    name: 'manage_object_types',
                    title: objectType.name,
                    icon: 'chevron-left',
                    href: '/admin/content/custom_objects/manage_object_types'
                });
                
                result = result.split('^angular_script^').join(pb.js.getAngularController(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls),
                    pills: pills,
                    tabs: tabs,
                    objectTypes: objectTypes,
                    objectType: objectType
                }));
                
                result += pb.js.getJSTag('var customObject = ' + JSON.stringify(objectType));
                
                cb({content: result});
            });
        });
    });
};

//exports
module.exports = EditObjectType;
