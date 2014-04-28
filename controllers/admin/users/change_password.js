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
	var vars = this.pathVars;
    if(!vars.id) {
        this.redirect(pb.config.siteRoot + '/admin/users/manage_users', cb);
        return;
    }
    if(self.session.authentication.user_id != vars.id) {
        this.redirect(pb.config.siteRoot + '/admin/users/manage_users', cb);
        return;
    }
    
    var dao = new pb.DAO();
    dao.loadById(vars['id'], 'user', function(err, user) {
        if(util.isError(err) || user == null) {
            self.redirect(pb.config.siteRoot + '/admin/users/manage_users', cb);
            return;
        }

        delete user.password;
        self.setPageName(loc.users.CHANGE_PASSWORD);
        self.ts.registerLocal('user_id', user._id);
        self.ts.load('admin/users/change_password', function(err, data) {
            var result = '' + data;
            
            var tabs = [
                {
                    active: 'active',
                    href: '#password',
                    icon: 'key',
                    title: self.ls.get('PASSWORD')
                }
            ];
            
            var pills = [
            {
                name: 'manage_users',
                title: loc.users.CHANGE_PASSWORD,
                icon: 'chevron-left',
                href: '/admin/users/manage_users'
            }];
            
            result = result.split('^angular_script^').join(pb.js.getAngularController(
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
