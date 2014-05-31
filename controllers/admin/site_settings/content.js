/**
 * Interface for changing the site's content configuration
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Content(){};

//dependencies
var SiteSettings = require('../site_settings');

//inheritance
util.inherits(Content, pb.BaseController);

//statics
var SUB_NAV_KEY = 'content_settings';

Content.prototype.render = function(cb) {
    var self = this;
    
    this.setPageName(self.ls.get('CONTENT'));
	this.ts.load('admin/site_settings/content', function(err, data) {
        var result = data;
        
        var tabs =
        [
            {
                active: 'active',
                href: '#articles',
                icon: 'files-o',
                title: self.ls.get('ARTICLES')
            },
            {
                href: '#timestamp',
                icon: 'clock-o',
                title: self.ls.get('TIMESTAMP')
            },
            {
                href: '#authors',
                icon: 'user',
                title: self.ls.get('AUTHOR')
            },
            {
                href: '#comments',
                icon: 'comment',
                title: self.ls.get('COMMENTS')
            }
        ];
        
        pb.content.getSettings(function(err, contentSettings) {
            self.setFormFieldValues(contentSettings);
            
            self.checkForFormRefill(result, function(newResult) {
                result = newResult;
                
                var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'content');
                
                var objects     = {
                    navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings'], self.ls),
                    pills: pills,
                    tabs: tabs
                };
                var angularData = pb.js.getAngularController(objects);
                result          = result.split('^angular_script^').join(angularData);

                cb({content: result});
            });
        });
    });
};

Content.getSubNavItems = function(key, ls, data) {
	var pills = SiteSettings.getPillNavOptions(ls);
    pills.splice(0, 1);
    pills.unshift(
    {
        name: 'configuration',
        title: ls.get('CONTENT'),
        icon: 'chevron-left',
        href: '/admin/site_settings/configuration'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, Content.getSubNavItems);

//exports
module.exports = Content;
