/**
 * Interface for changing the site's email configuration
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Email(){};

//inheritance
util.inherits(Email, pb.BaseController);

Email.prototype.render = function(cb) {
    var self = this;
	pb.templates.load('admin/site_settings/email', '^loc_EMAIL^', null, function(data) {
        var result = data;
        
        var tabs =
        [
            {
                active: 'active',
                href: '#preferences',
                icon: 'wrench',
                title: '^loc_PREFERENCES^'
            },
            {
                href: '#smtp',
                icon: 'upload',
                title: '^loc_SMTP^'
            }
        ];
        
        //TODO: move email settings over to pb
        getEmailSettings(function(emailSettings)
        {
            self.session = setFormFieldValues(emailSettings, self.session);
            
            prepareFormReturns(self.session, result, function(newSession, newResult)
            {
                self.session = newSession;
                result = newResult;
                
                var pills = require('../site_settings').getPillNavOptions('email');
                pills.splice(1, 1);
                pills.unshift(
                {
                    name: 'configuration',
                    title: '^loc_EMAIL^',
                    icon: 'chevron-left',
                    href: '/admin/site_settings/configuration'
                });
                
                var objects     = {
                    navigation: pb.AdminNavigation.get(self.session, ['settings', 'site_settings']),
                    pills: pills,
                    tabs: tabs
                };
                var angularData = pb.js.getAngularController(objects);
                result          = result.concat(angularData);
                
                var content = self.localizationService.localize(['admin', 'site_settings', 'articles'], result);
                cb({content: content});
            });
        });
    });
};

//exports
module.exports = Email;
