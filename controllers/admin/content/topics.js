/**
 * Topics - Topics Settings
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Topics(){}

//inheritance
util.inherits(Topics, pb.BaseController);

Topics.prototype.render = function(cb) {
	cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/topics/manage_topics'));
};

Topics.getPillNavOptions = function(activePill)
{
    var pillNavOptions = 
    [
        {
            name: 'import_topics',
            title: '',
            icon: 'upload',
            href: '/admin/content/topics/import_topics'
        },
        {
            name: 'new_topic',
            title: '',
            icon: 'plus',
            href: '/admin/content/topics/new_topic'
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

Topics.init = function(request, output)
{
    output({redirect: pb.config.siteRoot + '/admin/content/topics/manage_topics'});
};

//exports
module.exports = Topics;
