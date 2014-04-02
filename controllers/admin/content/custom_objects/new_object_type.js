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
	
	this.setPageName(this.ls.get('NEW_OBJECT'));
	this.ts.load('admin/content/custom_objects/new_object_type', function(err, data) {
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
                title: self.ls.get('loc_FIELDS')
            }
        ];
        
        var objectTypes = ['article', 'page', 'section', 'topic', 'media', 'user'];
        
        var dao = new pb.DAO();
        dao.query('custom_object_type', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL).then(function(customObjectTypes) {
		    if (util.isError(customObjectTypes)) {
			    //TODO handle this
		    }
            
            // Case insensitive test for duplicate name
            for(var i =0; i < customObjectTypes.length; i++) {
                objectTypes.push('custom:' + customObjectTypes[i].name);
            }
                
            var pills = require('../custom_objects').getPillNavOptions('new_object_type');
            pills.unshift(
            {
                name: 'manage_object_types',
                title: self.ls.get('NEW_OBJECT_TYPE'),
                icon: 'chevron-left',
                href: '/admin/content/custom_objects/manage_object_types'
            });
            
            result = result + pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls),
                pills: pills,
                tabs: tabs,
                objectTypes: objectTypes
            });
            
            cb({content: result});
        });
    });
};

//exports
module.exports = NewObjectType;
