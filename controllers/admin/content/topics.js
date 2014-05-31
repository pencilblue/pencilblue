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

Topics.getPillNavOptions = function(activePill) {
    return [
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
};

//exports
module.exports = Topics;
