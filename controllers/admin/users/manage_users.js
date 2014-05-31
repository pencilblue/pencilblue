/**
 * ManageUsers - Interface for managing users
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function ManageUsers(){}

//dependencies
var Users = require('../users');

//inheritance
util.inherits(ManageUsers, pb.BaseController);

//statics
var SUB_NAV_KEY = 'manage_users';

ManageUsers.prototype.render = function(cb) {
	var self = this;
	var dao  = new pb.DAO();
	dao.query('user', {admin: {$lte: self.session.authentication.user.admin}}).then(function(users) {
        if(util.isError(users) || users.length == 0) {
            self.redirect(pb.config.siteRoot + '/admin', cb);
            return;
        }

        self.setPageName(self.ls.get('MANAGE_USERS'));
        self.ts.load('admin/users/manage_users', function(err, data){
            var result = '' + data;
                
            var pills = pb.AdminSubnavService.get(SUB_NAV_KEY, self.ls, SUB_NAV_KEY);
            
            result = result.split('^angular_script^').join(pb.js.getAngularController(
            {
                navigation: pb.AdminNavigation.get(self.session, ['users', 'manage'], self.ls),
                pills: pills,
                users: users
            }, [], 'initUsersPagination()'));
                
            cb({content: result});
        });
    });
};

ManageUsers.getSubNavItems = function(key, ls, data) {
	var pills = Users.getPillNavOptions('manage_users');
    pills.unshift(
    {
        name: 'manage_users',
        title: ls.get('MANAGE_USERS'),
        icon: 'refresh',
        href: '/admin/users/manage_users'
    });
    return pills;
};

//register admin sub-nav
pb.AdminSubnavService.registerFor(SUB_NAV_KEY, ManageUsers.getSubNavItems);

//exports
module.exports = ManageUsers;
