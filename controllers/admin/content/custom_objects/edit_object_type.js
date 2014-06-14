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

//statics
var SUB_NAV_KEY = 'edit_custom_object_type';

EditObjectType.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;

    if(!vars.id) {
        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
        return;
    }

    var dao = new pb.DAO();
    dao.loadById(vars.id, 'custom_object_type', function(err, objectType) {
	    if(util.isError(err) || objectType === null) {
	        cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
            return;
	    }

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

                var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'edit_object_type', objectType);
                result    = result.split('^angular_script^').join(pb.js.getAngularController(
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

EditObjectType.getSubNavItems = function(key, ls, data) {
	var pills = CustomObjects.getPillNavOptions();
    pills.unshift(
    {
        name: 'manage_object_types',
        title: data.name,
        icon: 'chevron-left',
        href: '/admin/content/custom_objects/manage_object_types'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, EditObjectType.getSubNavItems);

//exports
module.exports = EditObjectType;
