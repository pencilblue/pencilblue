/**
 * DeleteSection - Deletes a site topic
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 */
function DeleteUser(){}

//inheritance
util.inherits(DeleteUser, pb.BaseController);

DeleteUser.prototype.render = function(cb) {
    var self    = this;
    var vars    = this.pathVars;

    var message = this.hasRequiredParams(vars, ['id']);
    if (message) {
        this.formError(message, '/admin/users/manage_users', cb);
        return;
    }

    //ensure existence
    var dao = new pb.DAO();
    dao.loadById(vars.id, 'user', function(err, user) {
        if(user === null) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/users/manage_users', cb);
            return;
        }

        //delete the user
        dao.deleteMatching({_id: ObjectID(vars.id)}, 'user').then(function(result) {
            if(result < 1) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/users/manage_users', cb);
                return;
            }

            self.session.success = user.username + ' ' + self.ls.get('DELETED');
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/users/manage_users'));
        });
    });
};

//exports
module.exports = DeleteUser;
