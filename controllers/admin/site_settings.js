/**
 * SiteSettings - Settings administration page
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function SiteSettings(){}

//inheritance
util.inherits(SiteSettings, pb.BaseController);

SiteSettings.prototype.render = function(cb) {
	this.redirect(pb.config.siteRoot + '/admin/site_settings/configuration', cb);
};

SiteSettings.getPillNavOptions = function(activePill) {
    var pillNavOptions = [
        {
            name: 'content',
            title: '^loc_CONTENT^',
            icon: 'quote-right',
            href: '/admin/site_settings/content'
        },
        {
            name: 'email',
            title: '^loc_EMAIL^',
            icon: 'envelope',
            href: '/admin/site_settings/email'
        }
    ];
    
    if(typeof activePill !== 'undefined') {
        for(var i = 0; i < pillNavOptions.length; i++) {
            if(pillNavOptions[i].name == activePill) {
                pillNavOptions[i].active = 'active';
                break;
            }
        }
    }
    return pillNavOptions;
};

//exports
module.exports = SiteSettings;
