/**
 * SaveHomePageSettings - Saves settings for the display of home page content in the Portfolio theme
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
 */

function SaveHomePageSettings() {}

//inheritance
util.inherits(SaveHomePageSettings, pb.BaseController);

SaveHomePageSettings.prototype.render = function(cb) {
    var self = this;

    this.getJSONPostParams(function(err, post) {
        delete post._id;

        var opts = {
            where: {settings_type: 'home_page'}
        };
        var dao = new pb.DAO();
        dao.q('portfolio_theme_settings', opts, function(err, homePageSettings) {
            if (util.isError(err)) {
                return self.reqHandler.serveError(err);
            }
            if(homePageSettings.length > 0) {
                homePageSettings = homePageSettings[0];
                pb.DocumentCreator.update(post, homePageSettings);
            }
            else {
                homePageSettings = pb.DocumentCreator.create('portfolio_theme_settings', post);
                homePageSettings.settings_type = 'home_page';
            }

            dao.save(homePageSettings, function(err, result) {
                if(util.isError(err))  {
                    cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('ERROR_SAVING'), result)
                    });
                    return;
                }

                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('HOME_PAGE_SETTINGS') + ' ' + self.ls.get('SAVED'))});
            });
        });
    });
};

SaveHomePageSettings.prototype.getSanitizationRules = function() {
    return {
        page_layout: pb.BaseController.getContentSanitizationRules()
    };
};

SaveHomePageSettings.getRoutes = function(cb) {
    var routes = [
        {
            method: 'post',
            path: '/actions/admin/plugins/settings/portfolio/home_page',
            auth_required: true,
            access_level: ACCESS_EDITOR,
            content_type: 'text/html'
        }
    ];
    cb(null, routes);
};

//exports
module.exports = SaveHomePageSettings;
