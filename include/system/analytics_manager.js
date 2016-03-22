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

//dependencies
var async  = require('async');
var domain = require('domain');
var util   = require('../util.js');

module.exports = function AnalyticsManagerModule(pb) {

    //pb dependencies
    var ValidationService = pb.ValidationService;

    /**
     * Provides functionality to render HTML snippets to report metrics back to
     * registered analytics providers.
     * @class AnalyticsManager
     * @constructor
     * @param {Object} options
     * @param {String} [options.site='global']
     * @param {Integer} [options.timeout=25] The amount of time, in
     * milliseconds, that the manager will wait for each provider to render.
     */
    function AnalyticsManager(options) {

        /**
         * The site context for the instance
         * @property site
         * @type {String}
         */
        this.site = options.site || pb.SiteService.GLOBAL_SITE;

        /**
         * The amount of time, in milliseconds, that the manager will wait for
         * each provider to render.
         * @property timeout
         * @type {Integer}
         */
        this.timeout = options.timeout || DEFAULT_TIMEOUT;
    }

    /**
     * Stores the registered analytics providers
     * @private
     * @static
     * @readonly
     * @property PROVIDER_HOOKS
     * @type {Object}
     */
    var PROVIDER_HOOKS = {};

    /**
     * Stores the registered runtime metrics for the providers
     * @private
     * @static
     * @readonly
     * @property STATS
     * @type {Object}
     */
    var STATS = {
        cumulative: {
            count: 0,
            average: 0,
            min: Number.MAX_VALUE,
            max: 0
        },
        providers: {}
    };

    /**
     * The default amount of time, in milliseconds that the manager will wait
     * for each provider to render.
     * @private
     * @static
     * @readonly
     * @property DEFAULT_TIMEOUT
     * @type {Integer}
     */
    var DEFAULT_TIMEOUT = 25;

    /**
     * The value provided as the result of the rendering when there is nothing
     * to perform for a task
     * @private
     * @static
     * @readonly
     * @property DEFAULT_RESULT
     * @type {String}
     */
    var DEFAULT_RESULT = '';

    /**
     * Takes the provided request and session then checks with each of the
     * registered analytics providers to ensure get the HTML snippets to be
     * executed for analytics reporting.
     * @method gatherData
     * @param {Request} req The current incoming request
     * @param {Object} session The current user session
     * @param {Localization} ls An instance of the Localization service
     * @param {Function} cb A callback that provides two parameters.  An error, if
     * occurred, and a TemplateValue representing the HTML snippets for the analytic
     * providers.
     */
    AnalyticsManager.prototype.gatherData = function(req, session, ls, cb) {

        //retrieve keys and ensure there are providers to process
        var providerKeys = AnalyticsManager.getKeys(this.site);
        if (providerKeys.length === 0) {
            return cb(null, DEFAULT_RESULT);
        }

        //build the task list
        var self = this;
        var tasks = util.getTasks(providerKeys, function(keys, i) {
            return self.buildRenderTask(keys[i], req, session, ls);
        });
        async.parallel(tasks, function(err, results) {
            cb(err, new pb.TemplateValue(results.join(''), false));
        });
    };

    /**
     *
     * @static
     * @method buildRenderTask
     * @param {String} key
     * @param {Request} req
     * @param {Object} session
     * @param {Localization} ls
     * @return {Function}
     */
    AnalyticsManager.prototype.buildRenderTask = function(key, req, session, ls) {
        var site = this.site;
        var timeout = this.timeout;

        return function(callback) {
            if (pb.log.isSilly()) {
                pb.log.silly("AnalyticsManager: Rendering provider [%s] for URL [%s:%s]", key, req.method, req.url);
            }

            //build context object for builder functions to have access to params
            var opts = {
                method: req.method,
                url: req.url,
                key: key,
                callback: callback,
                th: null,
                start: null
            };

            //create a domain for the task to operate within
            var d = domain.create();
            d.run(function() {

                //set the execution timeout.  We set it here and not outside of the
                //domain to ensure that it gets a fair shot at running for the entire
                //allotted timeout.  Setting it outside makes it subject to other lines
                //of execution already in queue that will burn through the timeout
                //before execution of this domain begins.
                opts.start = new Date().getTime();
                opts.th = setTimeout(AnalyticsManager.buildTimeoutHandler(opts), timeout);

                var provider = PROVIDER_HOOKS[pb.SiteService.GLOBAL_SITE] || [];
                if (PROVIDER_HOOKS[site] && PROVIDER_HOOKS[site][key]) {
                    provider = PROVIDER_HOOKS[site];
                }
                provider[key](req, session, ls, AnalyticsManager.buildProviderResponseHandler(opts));
            });
            d.once('error', AnalyticsManager.buildDomainErrorHandler(opts));
        };
    };

    /**
     *
     * @static
     * @method buildProviderResponseHandler
     * @param {Object} opts
     * @param {String} opts.key
     * @param {String} opts.method
     * @param {String} opts.url
     * @param {Integer} opts.start The epoch when the provider started execution
     * @param {Object} opts.th The timeout handle for the provider execution
     * @param {Function} opts.callback
     * @return {Function}
     */
    AnalyticsManager.buildProviderResponseHandler = function(opts) {
        return function(err, result) {
            if (util.isError(err)) {
                pb.log.error("AnalyticsManager: Rendering provider [%s] failed for URL [%s:%s]\n%s", opts.key, opts.method, opts.url, err.stack);
            }

            //collect runtime metrics
            AnalyticsManager.updateStats(opts.start, opts.key);

            //we only callback if the timeout handle exists.  When
            //null, it means that the task already timed out and we
            //shouldn't attempt to send back a result.
            if (opts.th !== null) {
                clearTimeout(opts.th);
                opts.th = null;

                //the error is left out on purpose.  It is logged above
                //and we want all other providers to have a chance.
                opts.callback(null, result);
            }
        };
    };

    /**
     *
     * @static
     * @method buildDomainErrorHandler
     * @param {Object} opts
     * @param {String} opts.key
     * @param {String} opts.method
     * @param {String} opts.url
     * @param {Integer} opts.start The epoch when the provider started execution
     * @param {Object} opts.th The timeout handle for the provider execution
     * @param {Function} opts.callback
     * @return {Function}
     */
    AnalyticsManager.buildDomainErrorHandler = function(opts) {
        return function(err) {
            pb.log.error('AnalyticsManager: Rendering provider [%s] failed for URL [%s:%s]\n%s', opts.key, opts.method, opts.url, err.stack);

            //only callback if the timeout handle is still in place
            if (opts.th !== null) {
                clearTimeout(opts.th);
                opts.th = null;

                //collect runtime metrics
                AnalyticsManager.updateStats(opts.start, opts.key);
                opts.callback(null, DEFAULT_RESULT);
            }
        };
    };

    /**
     * Updates the runtime statistics to include
     * @static
     * @method getStats
     * @return {Object}
     */
    AnalyticsManager.updateStats = function(startTime, provider) {
        var runTime = (new Date().getTime()) - startTime;
        updateStatBlock(STATS.cumulative, runTime);
        updateStatBlock(STATS.providers[provider], runTime);
    };

    /**
     * @private
     * @static
     * @method updateStatBlock
     * @param {Integer} runTime The amount of time that the provider ran in
     * milliseconds
     * @param {Object} block The block that contains the stats for the provider
     */
    function updateStatBlock(block, runTime) {
        if (runTime > block.max) {
            block.max = runTime;
        }
        if (runTime < block.min) {
            block.min = runTime;
        }
        block.average = (runTime + (block.count * block.average)) / (++block.count);
    }

    /**
     * Retrieves timing metrics for analytic providers.  Handy for debugging
     * timeouts
     * @static
     * @method getStats
     * @return {Object}
     */
    AnalyticsManager.getStats = function() {
        return util.clone(STATS);
    };

    /**
     * @static
     * @method buildTimeoutHandler
     * @param {Object} opts
     * @return {Function}
     */
    AnalyticsManager.buildTimeoutHandler = function(opts) {
        return function() {
            pb.log.warn("AnalyticsManager: Rendering for provider [%s] timed out", opts.key);

            opts.th = null;
            opts.callback(null, '');
        };
    };

    /**
     * Registers an analytics provider.  When a template is being rendered and
     * encounters the ^analytics^ directive "onPageRender" is called.
     * @static
     * @method registerProvider
     * @param {String} name The provider's name
     * @param {String} [site='global']
     * @param {Function} onPageRendering A function that is called for every
     * requests that intends to execute HTML snippets to track analytics.  The
     * function is expected to take 4 parameters.  The first is the current Request
     * object.  The second is the current user session object. The third is an
     * instance of Localization.  The last is a callback that should be called with
     * two parameters.  The first is an error, if occurred and the second is raw
     * HTML string that represents the snippet to be executed by the analytics
     * plugin.
     */
    AnalyticsManager.registerProvider = function(name, site, onPageRendering) {
        if (util.isFunction(site)) {
            onPageRendering = site;
            site = pb.SiteService.GLOBAL_SITE;
        }

        if (!ValidationService.validateNonEmptyStr(name, true) ||
            !util.isFunction(onPageRendering) || AnalyticsManager.isRegistered(name, site)) {
            return false;
        }
        if (!PROVIDER_HOOKS[site]) {
            PROVIDER_HOOKS[site] = {};
        }

        PROVIDER_HOOKS[site][name] = onPageRendering;

        //setup metrics
        STATS.providers[name] = {
            count: 0,
            average: 0,
            min: Number.MAX_VALUE,
            max: 0
        };
        return true;
    };

    /**
     * Unregisters an analytics provider
     * @static
     * @method unregisterProvider
     * @param {String} name
     * @param {String} [site='global']
     * @return {Boolean} TRUE if was unregistered, FALSE if not found
     */
    AnalyticsManager.unregisterProvider = function(name, site) {
        if (!util.isString(site)) {
            site = pb.SiteService.GLOBAL_SITE;
        }
        if (!AnalyticsManager.isRegistered(name, site)) {
            return false;
        }
        delete PROVIDER_HOOKS[site][name];
        return true;
    };

    /**
     * Indicates if an analytics provider with the specified name has already
     * registered itself.
     * @static
     * @method isRegistered
     * @param {String} name The name of the analytics provider to check registration for
     * @param {String} [site='global']
     * @return {Boolean} TRUE when the provider is registered, FALSE if not
     */
    AnalyticsManager.isRegistered = function(name, site) {
        if (!util.isString(site)) {
            site = pb.SiteService.GLOBAL_SITE;
        }
        return !util.isNullOrUndefined(PROVIDER_HOOKS[site]) &&
            util.isFunction(PROVIDER_HOOKS[site][name]);
    };

    /**
     * Called when a page is rendering.  It creates a new instance of the analytics
     * manager and constructs the javascript snippets (wrappered in TemplateValue)
     * needed for the analytics plugins
     * @static
     * @method onPageRender
     * @param {Request} req
     * @param {Object} session
     * @param {Localization} ls
     * @param {Function} cb A callback that provides two parameters.  An error, if
     * occurred, and a TemplateValue representing the HTML snippets for the analytic
     * providers.
     */
    AnalyticsManager.onPageRender = function(req, session, ls, cb) {
        var context = {
            site: pb.RequestHandler.sites[req.headers.host] ? pb.RequestHandler.sites[req.headers.host].uid : null,
            timeout: pb.config.analytics.timeout
        };
        var managerInstance = new AnalyticsManager(context);
        managerInstance.gatherData(req, session, ls, cb);
    };

    /**
     * @static
     * @method getKeys
     * @param {String} site
     * @return {Array}
     */
    AnalyticsManager.getKeys = function(site) {
        var keyHash = {};
        var keyFunc = keyHandler(keyHash);

        //check for global keys.  They apply to all sites
        if (PROVIDER_HOOKS[pb.SiteService.GLOBAL_SITE]) {
            (Object.keys(PROVIDER_HOOKS[pb.SiteService.GLOBAL_SITE]) || []).forEach(keyFunc);
        }

        //check for non-global site keys
        if(PROVIDER_HOOKS[site] && site !== pb.SiteService.GLOBAL_SITE) {
            Object.keys(PROVIDER_HOOKS[site]).forEach(keyFunc);
        }
        return Object.keys(keyHash);
    }

    /**
     * @private
     * @static
     * @method keyHandler
     * @param {Object} keyHash
     * @return {Function}
     */
    function keyHandler(keyHash) {
        return function(key) {
            keyHash[key] = true;
        };
    }

    //exports
    return AnalyticsManager;
};
