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

/**
 * @static
 * @method
 * @param {string} activePill The name of the active pill
 * @param {Localization} ls LocalizationService for Translation
 * @returns {Array}
 */
SiteSettings.getPillNavOptions = function(activePill, ls) {
    var pillNavOptions = [
        {
            name: 'content',
            title: ls.get('CONTENT'),
            icon: 'quote-right',
            href: '/admin/site_settings/content'
        },
        {
            name: 'email',
            title: ls.get('EMAIL'),
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
