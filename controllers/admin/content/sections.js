/*

    
    
    @author Blake Callens <blake.callens@gmail.com>
    

*/
/**
 * Pages administration page
 * @author Blake Callens <blake.callens@gmail.com>
 * @copyright PencilBlue 2013, All rights reserved
 */
function Section(){}

//inheritance
util.inherits(Section, pb.BaseController);

Section.prototype.render = function(cb) {
	cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/content/topics/section_map'));
};

Section.getPillNavOptions = function(activePill) {
    var pillNavOptions = [
        {
            name: 'new_section',
            title: '',
            icon: 'plus',
            href: '/admin/content/sections/new_section'
        }
    ];
    
    if (typeof activePill !== 'undefined') {
        for (var i = 0; i < pillNavOptions.length; i++) {
            
        	if (pillNavOptions[i].name == activePill) {
                pillNavOptions[i].active = 'active';
            }
        }
    }
    return pillNavOptions;
};

//legacy code to be removed
Section.init = function(request, output) {
    output({redirect: pb.config.siteRoot + '/admin/content/topics/section_map'});
};

//exports
module.exports = Section;