module.exports = function(pb) {
    
    //pb dependencies
    var util = pb.util;

    function ActivateSite(){}
    util.inherits(ActivateSite, pb.BaseController);

    ActivateSite.prototype.render = function(cb)
    {
		var self = this;
        var vars = this.pathVars;

        var message = this.hasRequiredParams(vars, ['id']);
        if(message) {
            self.formError(message, '/admin/sites', cb);
            return;
        }

        var siteService = new pb.SiteService();
        var jobId = siteService.activateSite(vars.id);
        var content = pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, '', jobId);
        cb({content: content});
    };

    //exports
    return ActivateSite;
};