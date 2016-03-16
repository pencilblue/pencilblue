/*
 Copyright (C) 2016  PencilBlue, LLC

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

module.exports = function (pb) {

    /**
     * GoogleAnalytics - A sample for exemplifying what the main module file should
     * look like.
     *
     * @class GoogleAnalytics
     * @constructor
     */
    function GoogleAnalytics(){}

    /**
     * The ID for the analytics provider
     * @private
     * @static
     * @readonly
     * @property PROVIDER_NAME
     * @type {String}
     */
    var PROVIDER_NAME = 'google_analytics';

    /**
     * Called when the application is being installed for the first time.
     *
     * @param cb A callback that must be called upon completion.  cb(err, result).
     * The result is ignored
     */
    GoogleAnalytics.onInstall = function(cb) {
        cb(null, true);
    };

    /**
     * Called when the application is uninstalling this plugin.  The plugin should
     * make every effort to clean up any plugin-specific DB items or any in function
     * overrides it makes.
     *
     * @param cb A callback that must be called upon completion.  cb(err, result).
     * The result is ignored
     */
    GoogleAnalytics.onUninstall = function(cb) {
        var result = pb.AnalyticsManager.unregisterProvider(PROVIDER_NAME);
        cb(null, result);
    };

    /**
     * Called when the application is starting up. The function is also called at
     * the end of a successful install. It is guaranteed that all core PB services
     * will be available including access to the core DB.
     *
     * @param cb A callback that must be called upon completion.  cb(err, result).
     * The result is ignored
     */
    GoogleAnalytics.onStartupWithContext = function(context, cb) {
        var result = pb.AnalyticsManager.registerProvider(PROVIDER_NAME, context.site, GoogleAnalytics.onRequest);
        pb.AnalyticsManager.registerProvider(PROVIDER_NAME+'2', context.site, GoogleAnalytics.onRequest);
        cb(null, result);
    };

    /**
     * Called on each request
     *
     */
    GoogleAnalytics.onRequest = function(req, session, ls, cb) {
        var siteId = pb.SiteService.getCurrentSite(pb.RequestHandler.sites[req.headers.host] ? pb.RequestHandler.sites[req.headers.host].uid : null);
        var context = {
            site: siteId,
            pluginService: new pb.PluginService({site: siteId}),
            req: req,
            session: session,
            ls: ls
        };
        var gaRenderService = new (pb.PluginService.getService('GoogleAnalyticsRenderService', 'ga', siteId))(context);
        gaRenderService.render(cb);
    };

    /**
     * Called when the application is gracefully shutting down.  No guarantees are
     * provided for how much time will be provided the plugin to shut down.
     *
     * @param cb A callback that must be called upon completion.  cb(err, result).
     * The result is ignored
     */
    GoogleAnalytics.onShutdown = function(cb) {
        cb(null, true);
    };

    //exports
    return GoogleAnalytics;
};
