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

CustomObjects.getPillNavOptions = function(activePill)
{
    var pillNavOptions = 
    [
        {
            name: 'new_object_type',
            title: '',
            icon: 'plus',
            href: '/admin/content/custom_objects/new_object_type'
        }
    ];
    
    if(typeof activePill !== 'undefined')
    {
        for(var i = 0; i < pillNavOptions.length; i++)
        {
            if(pillNavOptions[i].name == activePill)
            {
                pillNavOptions[i].active = 'active';
            }
        }
    }
    
    return pillNavOptions;
};

CustomObjects.init = function(request, output)
{
    output({redirect: pb.config.siteRoot + '/admin/content/custom_objects/manage_object_types'});
};

//exports
module.exports = CustomObjects;
