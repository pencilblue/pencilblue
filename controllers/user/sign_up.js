/**
 * SignUp - Interface for signing a user up
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function SignUp(){}

//inheritance
util.inherits(SignUp, pb.BaseController);

SignUp.prototype.render = function(cb) {
	var self = this;

	pb.content.getSettings(function(err, contentSettings) {
        if(!contentSettings.allow_comments) {
            self.redirect(pb.config.siteRoot, cb);
            return;
        }

        self.ts.load('user/sign_up', function(err, data) {
            cb({content: self.ls.localize([], data)});
        });
    });
};

//exports
module.exports = SignUp;
