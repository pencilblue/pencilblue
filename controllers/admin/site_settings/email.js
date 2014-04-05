/**
 * Interface for changing the site's email configuration
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Email(){};

//dependencies
var SiteSettings = require('../site_settings');

//inheritance
util.inherits(Email, pb.BaseController);

Email.prototype.render = function(cb) {
    var self = this;
    
    this.setPageName(self.ls.get('EMAIL'));
	this.ts.load('admin/site_settings/email', function(err, data) {
        var result = data;
        
        var tabs =
        [
            {
                active: 'active',
                href: '#preferences',
                icon: 'wrench',
                title: self.ls.get('PREFERENCES')
            },
            {
                href: '#smtp',
                icon: 'upload',
                title: self.ls.get('SMTP')
            }
        ];
        
        pb.email.getSettings(function(emailSettings) {
            self.setFormFieldValues(emailSettings);
            
            self.checkForFormRefill(result, function(newResult) {
                result = newResult;
                
                var pills = SiteSettings.getPillNavOptions('email', self.ls);
                pills.splice(1, 1);
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
module.exports = Email;
