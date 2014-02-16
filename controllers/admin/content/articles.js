/**
 * Articles - Articles administration page
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Articles(){}

//inheritance
util.inherits(Articles, pb.BaseController);

Articles.prototype.render = function(cb) {
	cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/articles/manage_articles'));
};

Articles.getPillNavOptions = function(activePill) {
    var pillNavOptions = 
    [
        {
            name: 'new_article',
            title: '',
            icon: 'plus',
            href: '/admin/content/articles/new_article'
        }
    ];
    
    if(typeof activePill !== 'undefined') {
        for(var i = 0; i < pillNavOptions.length; i++) {
            if(pillNavOptions[i].name == activePill) {
                pillNavOptions[i].active = 'active';
            }
        }
    }
    return pillNavOptions;
};

//exports
module.exports = Articles;
