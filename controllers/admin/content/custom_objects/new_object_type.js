/**
 * Create a new custom object
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewObjectType(){}

//inheritance
util.inherits(NewObjectType, pb.BaseController);

//dependencies
var CustomObjects = require('../custom_objects');

//statics
var SUB_NAV_KEY = 'new_custom_object_type';

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
                title: self.ls.get('FIELDS')
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
                
            var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'new_object_type');            
            result    = result.split('^angular_script^').join(pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['content', 'custom_objects'], self.ls),
                pills: pills,
                tabs: tabs,
                objectTypes: objectTypes
            }));
            
            cb({content: result});
        });
    });
};

NewObjectType.getSubNavItems = function(key, ls, data) {
	var pills = CustomObjects.getPillNavOptions();
	pills.unshift(
    {
        name: 'manage_object_types',
        title: ls.get('NEW_OBJECT_TYPE'),
        icon: 'chevron-left',
        href: '/admin/content/custom_objects/manage_object_types'
    });
	return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, NewObjectType.getSubNavItems);

//exports
module.exports = NewObjectType;
