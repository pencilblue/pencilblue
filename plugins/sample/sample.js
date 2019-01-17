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
'use strict';

module.exports = function SamplePluginModule(pb) {

    /**
     * SamplePlugin - A sample for exemplifying what the main module file should
     * look like.
     * @class SamplePlugin
     * @constructor
     */
    function SamplePlugin(){}

    /**
     * Called when the application is being installed for the first time.
     * @static
     * @method onInstallWithContext
     * @param {object} context
     * @param {string} context.site
     * @param {function} cb (Error, Boolean) A callback that must be called upon completion.
     * The result should be TRUE on success and FALSE on failure
     */
    SamplePlugin.onInstallWithContext = function(context, cb) {
        cb(null, true);
    };

    /**
     * Called when the application is uninstalling this plugin.  The plugin should
     * make every effort to clean up any plugin-specific DB items or any in function
     * overrides it makes.
     * @static
     * @method onUninstallWithContext
     * @param {object} context
     * @param {string} context.site
     * @param {function} cb (Error, Boolean) A callback that must be called upon completion.
     * The result should be TRUE on success and FALSE on failure
     */
    SamplePlugin.onUninstallWithContext = function (context, cb) {
        var site = pb.SiteService.getCurrentSite(context.site);

        // Remove "sample" nav during uninstall
        pb.AdminNavigation.removeFromSite("sample", site);
        cb(null, true);
    };

    /**
     * Called when the application is starting up. The function is also called at
     * the end of a successful install. It is guaranteed that all core PB services
     * will be available including access to the core DB.
     * @static
     * @method onStartupWithContext
     * @param {object} context
     * @param {string} context.site
     * @param {function} cb (Error, Boolean) A callback that must be called upon completion.
     * The result should be TRUE on success and FALSE on failure
     */
    SamplePlugin.onStartupWithContext = function (context, cb) {

        /**
         * Example for hooking into the RequestHandler for custom control flow.  The context will also provide the site.
         * This means that for multi-site implementations where the plugin is installed on a per plugin basis the hook
         * should only be registered ONCE.  Otherwise it will execute multiple times causing performance to degrade
         * @param ctx {object}
         * @param {RequestHandler} ctx.requestHandler
         * @param {object} ctx.themeRoute
         * @param {function} (Error)
         */
        pb.RequestHandler.on(pb.RequestHandler.THEME_ROUTE_RETIEVED, function (ctx, callback) {
            //do what ever needs to be done.  Use the callback to continue normal control flow or don't if you need to do redirects
            pb.log.debug('SamplePlugin: The request handler hook triggered for request: %s', ctx.requestHandler.url.path);
            callback();
        });

        /**
         * Administration Navigation sample
         */
        var site = pb.SiteService.getCurrentSite(context.site);
        // Add a new top level node
        pb.AdminNavigation.addToSite({
            id: "sample",
            title: "Sample",
            icon: "cogs",
            href: "/admin/sample",
            access: pb.SecurityService.ACCESS_USER,
            children: [
                {
                    id: "sample_1",
                    title: "Random Text",
                    icon: "cog",
                    href: "/sample/random/text",
                    access: pb.SecurityService.ACCESS_USER
                }
            ]
        }, site);

        // Add a child to the top level node "sample"
        pb.AdminNavigation.addChildToSite("sample", {
            id: "sample_2",
            title: "Sample Child 2",
            icon: "cog",
            href: "/admin/sample/2",
            access: pb.SecurityService.ACCESS_USER
        }, site);

        // Add a child to the top level node "sample"
        pb.AdminNavigation.addChildToSite("sample", {
            id: "sample_3",
            title: "Redirect Home",
            icon: "cog",
            href: "/sample/redirect/home",
            access: pb.SecurityService.ACCESS_USER
        }, site);

        // Remove "sample_2"
        pb.AdminNavigation.removeFromSite("sample_2", site);

        cb(null, true);
    };

    /**
     * Called when the application is gracefully shutting down.  No guarantees are
     * provided for how much time will be provided the plugin to shut down or which
     * services will be available at shutdown
     * @static
     * @method onShutdown
     * @param {function} cb (Error, Boolean) A callback that must be called upon completion.
     * The result should be TRUE on success and FALSE on failure
     */
    SamplePlugin.onShutdown = function(cb) {
        cb(null, true);
    };

    //exports
    return SamplePlugin;
};
