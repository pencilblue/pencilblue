module.exports = function EditSiteActionModule(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Edits a current site
     */
    function EditSiteAction(){}
    util.inherits(EditSiteAction, pb.BaseController);

    EditSiteAction.prototype.render = function(cb)
    {
        var self = this;
        var siteid = this.pathVars.siteid;
        this.getJSONPostParams(function(err, post) {
            var message = self.hasRequiredParams(post, self.getRequiredFields());
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

            var siteService = new pb.SiteService();
            var dao = new pb.DAO();
            dao.loadByValue('uid', siteid, 'site', function(err, data) {
                siteService.isDisplayNameOrHostnameTaken(post.displayName, post.hostname, data._id, function (err, isTaken, field) {
                    if(isTaken) {
                        cb({
                            code: 400,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('DUPLICATE_INFO'))
                        });

                    } else {
                        data.displayName = post.displayName;
                        data.hostname = post.hostname;
                        dao.save(data, function(err, result) {
                            if(err) {
                                cb({
                                    code: 400,
                                    content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR SAVING'))
                                });
                                return;
                            }
                            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('SITE_UPDATED'), result)});
                        });
                    }

                });
            })

        });

    };

    EditSiteAction.prototype.getRequiredFields = function() {
        return['displayName', 'hostname']
    };

    //exports
    return EditSiteAction;
};