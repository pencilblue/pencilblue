

module.exports = function SamplePluginModule(pb) {
    
    /**
     * SamplePlugin - A sample for exemplifying what the main module file should
     * look like.
     *
     * @author Brian Hyder <brian@pencilblue.org>
     * @copyright 2015 PencilBlue, LLC
     */
    function SamplePlugin(){}

    /**
     * Called when the application is being installed for the first time.
     * @static
     * @method onInstallWithContext
     * @param cb A callback that must be called upon completion.  cb(Error, Boolean).
     * The result should be TRUE on success and FALSE on failure
     */
    SamplePlugin.onInstallWithContext = function(context, cb) {
        cb(null, true);
    };

    /**
     * Called when the application is uninstalling this plugin.  The plugin should
     * make every effort to clean up any plugin-specific DB items or any in function
     * overrides it makes.
     *
     * @param context
     * @param cb A callback that must be called upon completion.  cb(Error, Boolean).
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
     *
     * @param context
     * @param cb A callback that must be called upon completion.  cb(Error, Boolean).
     * The result should be TRUE on success and FALSE on failure
     */
    SamplePlugin.onStartupWithContext = function (context, cb) {

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
     * provided for how much time will be provided the plugin to shut down.
     *
     * @param cb A callback that must be called upon completion.  cb(Error, Boolean).
     * The result should be TRUE on success and FALSE on failure
     */
    SamplePlugin.onShutdown = function(cb) {
        cb(null, true);
    };

    //exports
    return SamplePlugin;
};
