/**
 * SamplePlugin - A sample for exemplifying what the main module file should
 * look like.
 *
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC
 */
function SamplePlugin(){}

/**
 * Called when the application is being installed for the first time.
 *
 * @param cb A callback that must be called upon completion.  cb(Error, Boolean).
 * The result should be TRUE on success and FALSE on failure
 */
SamplePlugin.onInstall = function(cb) {
	cb(null, true);
};

/**
 * Called when the application is uninstalling this plugin.  The plugin should
 * make every effort to clean up any plugin-specific DB items or any in function
 * overrides it makes.
 *
 * @param cb A callback that must be called upon completion.  cb(Error, Boolean).
 * The result should be TRUE on success and FALSE on failure
 */
SamplePlugin.onUninstall = function(cb) {
	// Remove "sample" nav during uninstall
    	pb.AdminNavigation.remove("sample");
	cb(null, true);
};

/**
 * Called when the application is starting up. The function is also called at
 * the end of a successful install. It is guaranteed that all core PB services
 * will be available including access to the core DB.
 *
 * @param cb A callback that must be called upon completion.  cb(Error, Boolean).
 * The result should be TRUE on success and FALSE on failure
 */
SamplePlugin.onStartup = function(cb) {

    /**
     * Administration Navigation sample
     */

    // Add a new top level node
    pb.AdminNavigation.add({
        id: "sample",
        title: "Sample",
        icon: "cogs",
        href: "/admin/sample",
        access: ACCESS_USER,
        children: [
            {
                id: "sample_1",
                title: "Sample Child 1",
                icon: "cog",
                href: "/admin/sample/1",
                access: ACCESS_USER
            }
        ]
    });

    // Add a child to the top level node "sample"
    pb.AdminNavigation.addChild("sample", {
        id: "sample_2",
        title: "Sample Child 2",
        icon: "cog",
        href: "/admin/sample/2",
        access: ACCESS_USER
    });

    // Add a child to the top level node "sample"
    pb.AdminNavigation.addChild("sample", {
        id: "sample_3",
        title: "Sample Child 3",
        icon: "cog",
        href: "/admin/sample/3",
        access: ACCESS_USER
    });

    // Remove "sample_2"
    pb.AdminNavigation.remove("sample_2");

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
module.exports = SamplePlugin;
