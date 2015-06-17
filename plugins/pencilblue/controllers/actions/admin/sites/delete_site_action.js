module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Deletes a current site
     */
    function DeleteSiteAction(){}
    util.inherits(DeleteSiteAction, pb.BaseController);

    DeleteSiteAction.prototype.render = function(cb) {
        var self = this;
        var siteid = this.pathVars.siteid;
        this.getJSONPostParams(function(err, post) {
            if(message) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
                });
                return;
            }

            if(!pb.security.isAuthorized(self.session, {admin_level: post.admin})) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INSUFFICIENT_CREDENTIALS'))
                });
                return;
            }

            var dao = new pb.DAO();
            dao.loadByValue('uid', siteid, 'site', function(err, data) {
                dao.delete({uid: siteid}, 'site', function(err, result) {
                    if(util.isError(err)) {
                        cb({
                            code: 400,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETING'))
                        });
                        return;
                    }
                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('SITE_DELETED'), result)});
                });
            })

        });

    };

    //exports
    return DeleteSiteAction;
};