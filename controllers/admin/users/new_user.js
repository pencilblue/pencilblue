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
            
        var pills = Users.getPillNavOptions('new_user');
        pills.unshift(
        {
            name: 'manage_users',
            title: self.getPageName(),
            icon: 'chevron-left',
            href: '/admin/users/manage_users'
        });
        
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

//exports
module.exports = NewUser;
