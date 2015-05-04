module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;
    
    /**
     * Creates a new site
     */
    function NewSite(){}
    util.inherits(NewSite, pb.BaseController);

    NewSite.prototype.render = function(cb)
    {
		var self = this;

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
            var site = pb.DocumentCreator.create('site', post);

            siteService.createSite(site, post.id, function(err, isTaken, field, result) {
                if(isTaken) {
                    if(field === 'hostname') {
                        cb({
                            code: 400,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('EXISTING_HOSTNAME'))
                        });
                    } else {
                        cb({
                            code: 400,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('EXISTING_DISPLAYNAME'))
                        });
                    }
                }
                if(util.isError(err)) {
                    cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_SAVING'))
                    });
                    return;
                }

                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('SITE_CREATED'), result)});
            });
        });

    };

    NewSite.prototype.getRequiredFields = function() {
        return ['displayName', 'hostname'];
    };

    //exports
    return NewSite;
};