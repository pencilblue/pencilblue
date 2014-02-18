/**
 * Create a new custom object
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewObjectType(){}

//inheritance
util.inherits(NewObjectType, pb.BaseController);

NewObjectType.prototype.render = function(cb) {
	var self = this;
	var get = this.pathVars;	
	
    if(!get['name']) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
        return;
    }
    
    var dao = new pb.DAO();
    dao.query('custom_object_type', {name: get['name']}).then(function(objectTypes) {
	    if (util.isError(objectTypes)) {
		    //TODO handle this
	    }
	    
	    if(objectTypes.length == 0)
	    {
	        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
            return;
	    }
	    
	    objectType = objectTypes[0];
	
	    pb.templates.load('admin/content/custom_objects/edit_object_type', objectType.name, null, function(data) {
            var result = ''+data;
            var tabs   =
            [
                {
                    active: 'active',
                    href: '#object_settings',
                    icon: 'cog',
                    title: '^loc_SETTINGS^'
                },
                {
                    href: '#object_fields',
                    icon: 'list-ul',
                    title: '^loc_FIELDS^'
                }
            ];
            
            var objectTypes = ['article', 'page', 'section', 'topic', 'media', 'user'];
            
            dao.query('custom_object_type', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL).then(function(customObjectTypes) {
		        if (util.isError(customObjectTypes)) {
			        //TODO handle this
		        }
                
                // Case insensitive test for duplicate name
                for(var i =0; i < customObjectTypes.length; i++)
                {
                    objectTypes.push('custom:' + customObjectTypes[i].name);
                }
            
                self.displayErrorOrSuccess(result, function(newResult) {
                    result = newResult;
                    
                    var pills = require('../custom_objects').getPillNavOptions('edit_object_type');
                    pills.unshift(
                    {
                        name: 'manage_object_types',
                        title: objectType.name,
                        icon: 'chevron-left',
                        href: '/admin/content/custom_objects/manage_object_types'
                    });
                    
                    result = result + pb.js.getAngularController(
                    {
                        navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects']),
                        pills: pills,
                        tabs: tabs,
                        objectTypes: objectTypes,
                        objectType: objectType
                    });
                    
                    result = result.split('^object_type_id^').join(objectType._id);
                    result += pb.js.getJSTag('var customObjectFields = ' + JSON.stringify(objectType.fields));
                    
                    var content = self.localizationService.localize(['admin', 'custom_objects'], result);
                    cb({content: content});
                });
            });
        });
    });
};

//exports
module.exports = NewObjectType;
