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

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * GoogleAnalyticsRenderService - An example of a service that generates random text.
     *
     * @author Brian Hyder <brian@pencilblue.org>
     * @copyright 2015 PencilBlue, LLC.  All Rights Reserved
     * @class GoogleAnalyticsRenderService
     * @constructor
     * @param {object} context
     * @param {Request} context.req
     * @param {Localization} context.ls
     * @param {object} context.session
     * @param {PluginService} context.pluginService
     * @param {string} context.site
     */
    function GoogleAnalyticsRenderService(context) {

        /**
         *
         * @property req
         * @type {Request}
         */
        this.req = context.req;

        /**
         *
         * @property ls
         * @type {Localization}
         */
        this.ls = context.ls;

        /**
         *
         * @property pluginService
         * @type {Object}
         */
        this.session = context.session;

        /**
         *
         * @property pluginService
         * @type {PluginService}
         */
        this.pluginService = context.pluginService;

        /**
         *
         * @property site
         * @type {String}
         */
        this.site = context.site;
    }

    /**
     * The UID for the plugin
     * @private
     * @static
     * @readonly
     * @property PLUGIN_UID
     * @type {String}
     */
    var PLUGIN_UID = 'ga';

    /**
     * Renders the script block for analytics
     * @method render
     * @param {Function} cb (Error, string)
     */
    GoogleAnalyticsRenderService.prototype.render = function(cb) {
        var self = this;

        //retrieve the settings for the plugin
        this.pluginService.getSettingsKV(PLUGIN_UID, function(err, settings) {
            if (util.isError(err)) {
                return cb(err, '');
            }
            if (!settings || !settings.google_analytics_tracking_id || settings.google_analytics_tracking_id.length === 0) {
                pb.log.warn('GoogleAnalytics: Settings have not been initialized! for site %s',  self.site);
                return cb(null, '');
            }

            var trackingId          = settings.google_analytics_tracking_id;
            var demographicsSupport = settings.demographics_support;
            var website             = pb.config.siteRoot.split('http://').join('').split('https://').join('');
            var script              = "<script>(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)})(window,document,'script','//www.google-analytics.com/analytics.js','ga');ga('create', '" + trackingId + "', '" + website + "');" + (demographicsSupport ? "ga('require', 'displayfeatures');" : "") + "ga('send', 'pageview');</script>";

            cb(null, script);
        });
    };

    /**
     * This function is called when the service is being setup by the system.  It is
     * responsible for any setup that is needed when first created.  The services
     * are all instantiated at once and are not added to the platform untill all
     * initialization is complete.  Relying on other plugin services in the
     * initialization could result in failure.
     *
     * @static
     * @method init
     * @param {function} cb (Error)
     */
    GoogleAnalyticsRenderService.init = function(cb) {
        pb.log.debug("GoogleAnalyticsRenderService: Initialized");
        cb(null, true);
    };

    /**
     * A service interface function designed to allow developers to name the handle
     * to the service object what ever they desire. The function must return a
     * valid string and must not conflict with the names of other services for the
     * plugin that the service is associated with.
     *
     * @static
     * @method getName
     * @return {String} The service name
     */
    GoogleAnalyticsRenderService.getName = function() {
        return "GoogleAnalyticsRenderService";
    };

    //exports
    return GoogleAnalyticsRenderService;
};
