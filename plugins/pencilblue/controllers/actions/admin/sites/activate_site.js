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

        var dao = new pb.DAO();
        dao.loadByValue('uid', vars.id, 'site', function(err, site) {
            if(util.isError(err) || site === null) {
                self.formError(self.ls.get('ERROR_LOADING'), '/admin/sites/' + vars.id, cb);
                return;
            }
            site.active = true;
            dao.save(site, function(err, result) {
                if(util.isError(err)) {
                    return self.formError(self.ls.get('ERROR_SAVING'), '/admin/sites/' + vars.id, cb);
                }

                pb.RequestHandler.loadSite(site);
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('SITE_ACTIVATED'), result)});
            });
        });
    }

    //exports
    return ActivateSite;
};