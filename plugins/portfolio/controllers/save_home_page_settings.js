/**
 * SaveHomePageSettings - Saves settings for the display of home page content in the Portfolio theme
 *
 * @author Blake Callens <blake@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC.  All Rights Reserved
 */

function SaveHomePageSettings() {}

//inheritance
util.inherits(SaveHomePageSettings, pb.FormController);

SaveHomePageSettings.prototype.onPostParamsRetrieved = function(post, cb) {
    var self = this;

    delete post.layout_link_url;
    delete post.media_position;
    delete post.media_max_height;
    delete post.media_search;
    delete post.media_url;

    post.page_layout = decodeURIComponent(post.page_layout);

    var dao = new pb.DAO();
    dao.query('portfolio_theme_settings', {settings_type: 'home_page'}).then(function(homePageSettings) {
        if(homePageSettings.length > 0) {
            homePageSettings = homePageSettings[0];
            pb.DocumentCreator.update(post, homePageSettings, ['page_media']);
        }
        else {
            homePageSettings = pb.DocumentCreator.create('portfolio_theme_settings', post, ['page_media']);
            homePageSettings.settings_type = 'home_page';
        }

        self.setFormFieldValues(post);

        dao.update(homePageSettings).then(function(result) {
            if(util.isError(result))  {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/plugins/settings/portfolio/home_page', cb);
                return;
            }

            self.session.success = self.ls.get('HOME_PAGE_SETTINGS') + ' ' + self.ls.get('SAVED');
            delete self.session.fieldValues;
            cb(pb.RequestHandler.generateRedirect(pb.config.siteRoot + '/admin/plugins/settings/portfolio/home_page'));
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
