/**
 * CustomObjects - Custom object settings
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function CustomObjects(){}

//inheritance
util.inherits(CustomObjects, pb.BaseController);

CustomObjects.prototype.render = function(cb) {
	cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'));
};

CustomObjects.getPillNavOptions = function() {
    return [
        {
            name: 'new_object_type',
            title: '',
            icon: 'plus',
            href: '/admin/content/custom_objects/new_object_type'
        }
    ];
};

//exports
module.exports = CustomObjects;
