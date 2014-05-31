/**
 * NewUser - Interface for adding a new user
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function NewUser(){}

//var dependencies
var Users = require('../users');

//inheritance
util.inherits(NewUser, pb.BaseController);

//statics
var SUB_NAV_KEY = 'new_user';

NewUser.prototype.render = function(cb) {
	var self = this;
	
	this.setPageName(self.ls.get('NEW_USER'));
	this.ts.registerLocal('image_title', this.ls.get('USER_PHOTO'));
	this.ts.registerLocal('uploaded_image', '');
	this.ts.load('admin/users/new_user', function(err, data) {
        var result = '' + data;
        
        var tabs = [
            {
                active: 'active',
                href: '#account_info',
                icon: 'cog',
                title: self.ls.get('ACCOUNT_INFO')
            },
            {
                href: '#personal_info',
                icon: 'user',
                title: self.ls.get('PERSONAL_INFO')
            }
        ];
            
        var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY);
        
        result = result.split('^angular_script^').join(pb.js.getAngularController(
        {
            navigation: pb.AdminNavigation.get(self.session, ['users'], self.ls),
            pills: pills,
            tabs: tabs,
            adminOptions: pb.users.getAdminOptions(self.session, self.localizationService),
        }));

        cb({content: result});
    });
};

NewUser.getSubNavItems = function(key, ls, data) {
	var pills = Users.getPillNavOptions();
    pills.unshift(
    {
        name: 'manage_users',
        title: ls.get('NEW_USER'),
        icon: 'chevron-left',
        href: '/admin/users/manage_users'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, NewUser.getSubNavItems);

//exports
module.exports = NewUser;
