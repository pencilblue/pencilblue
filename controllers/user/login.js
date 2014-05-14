/**
 * Login - Interface to authenticate a non-admin user
 * 
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function Login(){}

//inheritance
util.inherits(Login, pb.BaseController);

Login.prototype.render = function(cb) {
	
	this.setPageName(this.ls.get('LOGIN'));
	this.ts.load('user/login', function(err, data) {
        cb({content: data});
    });
};

//exports
module.exports = Login;
