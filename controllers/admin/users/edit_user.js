/**
 * EditUser - Interface for editing a user
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function EditUser(){}

//dependencies
var Users = require('../users');

//inheritance
util.inherits(EditUser, pb.BaseController);

EditUser.prototype.render = function(cb) {
	var self = this;
	var get  = this.query;
    if(!get.id) {
        this.redirect(pb.config.siteRoot + '/admin/users/manage_users', cb);
        return;
    }
    
    var dao = new pb.DAO();
    dao.loadById(get.id, 'user', function(err, user) {
        if(util.isError(err) || user == null) {
            self.redirect(pb.config.siteRoot + '/admin/users/manage_users', cb);
            return;
        }

        delete user.password;
        self.setPageName('Edit User');
        self.ts.registerLocal('user_id', user._id);
        self.ts.registerLocal('image_title', self.ls.get('USER_PHOTO'));
        self.ts.registerLocal('uploaded_image', user.photo ? user.photo : '');
        self.ts.load('admin/users/edit_user', function(err, data) {
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
                
            var pills = Users.getPillNavOptions('edit_user');
            pills.unshift(
            {
                name: 'manage_users',
                title: user.username,
                icon: 'chevron-left',
                href: '/admin/users/manage_users'
            });
            
            result = result.concat(pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['users'], self.ls),
                pills: pills,
                tabs: tabs,
                adminOptions: pb.users.getAdminOptions(self.session, self.localizationService), 
                user: user
            }));
               
            cb({content: result});
        });
    });
};

//exports
module.exports = EditUser;
