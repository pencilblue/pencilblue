/**
 * GoogleAnalytics - A sample for exemplifying what the main module file should
 * look like.
 *
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright 2014 PencilBlue, LLC
 */
function GoogleAnalytics(){}

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
    cb(null, true);
};

/**
 * Called when the application is starting up. The function is also called at
 * the end of a successful install. It is guaranteed that all core PB services
 * will be available including access to the core DB.
 *
 * @param cb A callback that must be called upon completion.  cb(err, result).
 * The result is ignored
 */
GoogleAnalytics.onStartup = function(cb) {
    pb.AnalyticsManager.registerProvider('google_analytics', function(req, session, ls, cb) {
        pb.plugins.getSettingsKV('ga', function(err, settings) {
            if (util.isError(err)) {
                return cb(err, '');
            }
            else if (!settings || !settings.google_analytics_tracking_id || settings.google_analytics_tracking_id.length === 0) {
                pb.log.warn('GoogleAnalytics: Settings have not been initialized!');
                return cb(null, '');
            }
            
            var trackingId          = settings.google_analytics_tracking_id;
            var demographicsSupport = settings.demographics_support;
            var website             = pb.config.siteRoot.split('http://').join('').split('https://').join('');
            var script              = "<script>(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics.js','ga');ga('create', '" + trackingId + "', '" + website + "');" + (demographicsSupport ? "ga('require', 'displayfeatures');" : "") + "ga('send', 'pageview');</script>";

            cb(null, script);
        });
    });
    cb(null, true);
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
module.exports = GoogleAnalytics;
