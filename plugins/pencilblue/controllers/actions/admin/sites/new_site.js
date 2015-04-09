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

            var site = pb.DocumentCreator.create('site', post);
            site.active = false;
            site.uid = getUid();
            pb.sites.isDisplayNameOrHostnameTaken(site.displayName, site.hostname, post.id, function(err, isTaken, field) {
                if(util.isError(err) || isTaken) {
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

                    return;
                }

                var dao = new pb.DAO();
                dao.save(site, function(err, result) {
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
        });

    }

    NewSite.prototype.getRequiredFields = function() {
        return ['displayName', 'hostname'];
    };

    function getUid()
    {
    	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {var r = Math.random()*16|0,v=c=='x'?r:r&0x3|0x8;return v.toString(16);});
    }

    //exports
    return NewSite;
};