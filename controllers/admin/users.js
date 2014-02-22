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

Users.getPillNavOptions = function(activePill) {
    var pillNavOptions = [
        {
            name: 'new_user',
            title: '',
            icon: 'plus',
            href: '/admin/users/new_user'
        }
    ];
    
    if(typeof activePill !== 'undefined') {
        for(var i = 0; i < pillNavOptions.length; i++) {
            if(pillNavOptions[i].name == activePill) {
                pillNavOptions[i].active = 'active';
                break;
            }
        }
    }
    
    return pillNavOptions;
};

//exports
module.exports = Users;
