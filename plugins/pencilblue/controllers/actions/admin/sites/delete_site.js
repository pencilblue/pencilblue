module.exports = function DeleteSiteActionModule(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Deletes a current site
     */
    function DeleteSiteAction(){}
    util.inherits(DeleteSiteAction, pb.BaseController);

    DeleteSiteAction.prototype.render = function(cb) {
        var self = this;
        var siteid = self.pathVars.siteid;
        var siteQueryService = new pb.SiteQueryService();
        siteQueryService.getCollections(function(err, allCollections) {
            siteQueryService.deleteSiteSpecificContent(allCollections, siteid, function(err, result) {
                if(util.isError(err)) {
                    cb({
                        code: 400,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_REMOVING'))
                    });
                    return
                }
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('REMOVE_SUCCESSFUL'), result)});
            });
        });

    };

    //exports
    return DeleteSiteAction;
};