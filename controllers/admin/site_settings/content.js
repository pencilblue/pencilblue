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
                
                var pills = SiteSettings.getPillNavOptions('content', self.ls);
                pills.splice(0, 1);
                pills.unshift(
                {
                    name: 'configuration',
                    title: self.getPageName(),
                    icon: 'chevron-left',
                    href: '/admin/site_settings/configuration'
                });
                
                var objects     = {
                    navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings'], self.ls),
                    pills: pills,
                    tabs: tabs
                };
                var angularData = pb.js.getAngularController(objects);
                result          = result.concat(angularData);

                cb({content: result});
            });
        });
    });
};

//exports
module.exports = Content;
