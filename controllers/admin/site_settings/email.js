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

//statics
var SUB_NAV_KEY = 'site_email_settings';

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

        pb.email.getSettings(function(err, emailSettings) {
            self.setFormFieldValues(emailSettings);

            self.checkForFormRefill(result, function(newResult) {
                result = newResult;

                var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, 'email');

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

Email.getSubNavItems = function(key, ls, data) {
	var pills = SiteSettings.getPillNavOptions(ls);
    pills.splice(1, 1);
    pills.unshift(
    {
        name: 'configuration',
        title: ls.get('EMAIL'),
        icon: 'chevron-left',
        href: '/admin/site_settings/configuration'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, Email.getSubNavItems);

//exports
module.exports = Email;
