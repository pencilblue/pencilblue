/**
 * Users - Users administration page
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Users(){}

//inheritance
util.inherits(Users, pb.BaseController);

Users.prototype.render = function(cb) {
	this.redirect(pb.config.siteRoot + '/admin/users/manage_users', cb);
};

Users.getPillNavOptions = function() {
    return [
        {
            name: 'new_user',
            title: '',
            icon: 'plus',
            href: '/admin/users/new_user'
        }
    ];
};

//exports
module.exports = Users;
