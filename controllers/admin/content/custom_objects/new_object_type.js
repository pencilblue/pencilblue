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
	
	pb.templates.load('admin/content/custom_objects/new_object_type', '^loc_NEW_OBJECT^', null, function(data) {
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
        
        var dao = new pb.DAO();
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
                
                var pills = require('../custom_objects').getPillNavOptions('new_object_type');
                pills.unshift(
                {
                    name: 'manage_object_types',
                    title: '^loc_NEW_OBJECT_TYPE^',
                    icon: 'chevron-left',
                    href: '/admin/content/custom_objects/manage_object_types'
                });
                
                result = result + pb.js.getAngularController(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects']),
                    pills: pills,
                    tabs: tabs,
                    objectTypes: objectTypes
                });
                
                var content = self.localizationService.localize(['admin', 'custom_objects'], result);
                cb({content: content});
            });
        });
    });
};

//exports
module.exports = NewObjectType;
