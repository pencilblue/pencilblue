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

ManageUsers.prototype.render = function(cb) {
	var self = this;
	var dao  = new pb.DAO();
	dao.query('user', {admin: {$lte: self.session.authentication.user.admin}}).then(function(users) {
        if(util.isError(users) || users.length == 0) {
            self.redirect(pb.config.siteRoot + '/admin', cb);
            return;
        }

        pb.templates.load('admin/users/manage_users', '^loc_MANAGE_USERS^', null, function(data){
            var result = '' + data;
            
            self.displayErrorOrSuccess(result, function(newResult) {
                result = newResult;
                
                var pills = Users.getPillNavOptions('manage_users');
                pills.unshift(
                {
                    name: 'manage_users',
                    title: '^loc_MANAGE_USERS^',
                    icon: 'refresh',
                    href: '/admin/users/manage_users'
                });
                
                result = result.concat(pb.js.getAngularController(
                {
                    navigation: pb.AdminNavigation.get(self.session, ['users']),
                    pills: pills,
                    users: users
                }, [], 'initUsersPagination()'));
                    
                var content = self.localizationService.localize(['admin', 'users'], result);
                cb({content: content});
            });
        });
    });
};

//exports
module.exports = ManageUsers;
