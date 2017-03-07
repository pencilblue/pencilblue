/*
    Copyright (C) 2017  PencilBlue, LLC

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

//dependencies
const _ = require('lodash');
const fs = require('fs');
const log = require('../../include/utils/logging').newInstance('RouteService');
const UrlUtils = require('../utils/urlUtils');

/**
 * The internal storage of routes after they are validated and processed.
 * @static
 * @property storage
 * @type {Array}
 */
let storage = [];
let index   = {};

/**
 * The internal storage of static routes after they are validated and processed.
 * @protected
 * @static
 * @property staticRoutes
 * @type {Object}
 */
let staticRoutes = {};

/**
 *
 */
class RouteService {

    /**
     * Provides the list of directories that are publicly available
     * @readonly
     * @type {Array}
     */
    static get PUBLIC_ROUTE_PREFIXES () {
        return ['/js/', '/css/', '/fonts/', '/img/', '/localization/', '/favicon.ico', '/docs/', '/bower_components/'];
    }

    /**
     * Validates a route descriptor.  The specified object must have a "controller"
     * property that points to a valid file and the "path" property must specify a
     * valid URL path structure.
     * @static
     * @method isValidRoute
     * @param {Object} descriptor The object to validate
     * @param {String} descriptor.controller The file path to the controller file
     * @param {String} descriptor.path The URL path
     */
    static isValidRoute (descriptor) {
        return fs.existsSync(descriptor.controller) &&
            !_.isNil(descriptor.path);
    }

    /**
     * Removes a route based on a URL path and theme UID
     * @static
     * @method unregisterRoute
     * @param {String} path The URL path
     * @param {String} theme The theme that owns the route
     * @param {string} site
     * @return {Boolean} TRUE if the route was found and removed, FALSE if not
     */
    static unregisterRoute (path, theme, site) {

        //get the pattern to check for
        var pattern    = null;
        var patternObj = RouteService.getRoutePattern(path);
        if (patternObj) {
            pattern = patternObj.pattern;
        }
        else {//invalid path provided
            return false;
        }

        //check if that pattern is registered for any theme
        var descriptor;
        if (staticRoutes[path]) {
            descriptor = staticRoutes[path];
        }
        else if (index[pattern]) {
            descriptor = storage[index[pattern]];
        }
        else {
            //not a static route or pattern route
            return false;
        }

        //return false if specified site has no themes registered on that descriptor
        //return false if theme doesnt exist on descriptor for that site
        if (!descriptor || !descriptor.themes[site] || !descriptor.themes[site][theme]) {
            return false;
        }

        //remove from service
        delete descriptor.themes[site][theme];
        descriptor.themes[site].size--;
        if(descriptor.themes[site].size < 1) {
            delete descriptor.themes[site];
        }
        return true;
    }

    /**
     * Registers a route
     * @param {Object} descriptor The route descriptor
     * @param {String} [descriptor.method='ALL'] The HTTP method associated with
     * the route
     * @param {String} descriptor.path The URL path for the route.  The route
     * supports wild cards a well as path variables (/get/:id)
     * @param {String} descriptor.controller The file path to the controller to
     * execute when the path is matched to an incoming request.
     * @param {Integer} [descriptor.access_level=0] Use global constants:
     * ACCESS_USER,ACCESS_WRITER,ACCESS_EDITOR,ACCESS_MANAGING_EDITOR,ACCESS_ADMINISTRATOR
     * @param {Boolean} [descriptor.setup_required=true] If true the system must have gone
     * through the setup process in order to pass validation
     * @param {Boolean} [descriptor.auth_required=false] If true, the user making the
     * request must have successfully authenticated against the system.
     * @param {String} [descriptor.content_type='text/html'] The content type header sent with the response
     * @param {Boolean} [descriptor.localization=false]
     * @param {String} theme The plugin/theme UID
     * @param {String} site The UID of site that owns the route
     * @return {Boolean} TRUE if the route was registered, FALSE if not
     */
    static registerRoute (descriptor, theme, site){

        //validate route
        if (!RouteService.isValidRoute(descriptor)) {
            log.error("RequestHandler: Route Validation Failed for: "+JSON.stringify(descriptor));
            return false;
        }

        //standardize http method (if exists) to upper case
        if (descriptor.method) {
            descriptor.method = descriptor.method.toUpperCase();
        }
        else {
            descriptor.method = 'ALL';
        }

        //make sure we get a valid prototype back
        var Controller = require(descriptor.controller);
        if (!Controller) {
            log.error('RequestHandler: Failed to get a prototype back from the controller module. %s', JSON.stringify(descriptor));
            return false;
        }

        //register main route
        var result = RouteService._registerRoute(descriptor, theme, site, Controller);

        //now check if we should localize the route
        if (descriptor.localization) {

            var localizedDescriptor = _.clone(descriptor);
            localizedDescriptor.path = UrlUtils.urlJoin('/:locale', descriptor.path);
            result = result && RouteService._registerRoute(localizedDescriptor, theme, site, Controller);
        }
        return result;
    }

    /**
     *
     * @private
     * @param {Object} descriptor
     * @param {String} theme
     * @param {String} site
     * @param {Function} Controller
     * @return {Boolean}
     */
    static _registerRoute (descriptor, theme, site, Controller) {
        //get pattern and path variables
        var patternObj = RouteService.getRoutePattern(descriptor.path);
        var pathVars   = patternObj.pathVars;
        var pattern    = patternObj.pattern;
        var isStatic   = Object.keys(pathVars).length === 0 && !patternObj.hasWildcard;

        //insert it
        var isNew = false;
        var routeDescriptor = null;
        if (isStatic && !_.isNil(staticRoutes[descriptor.path])) {
            routeDescriptor = staticRoutes[descriptor.path];
        }
        else if (!isStatic && !_.isNil(index[pattern])) {

            //exists so find it
            for (var i = 0; i < storage.length; i++) {
                var route = storage[i];
                if (route.pattern === pattern) {
                    routeDescriptor = route;
                    break;
                }
            }
        }
        else{//does not exist so create it
            isNew = true;
            routeDescriptor = {
                path: patternObj.path,
                pattern: pattern,
                path_vars: pathVars,
                expression: new RegExp(pattern),
                themes: {}
            };
        }

        //if the site has no themes on this route, add it
        if(!routeDescriptor.themes[site])
        {
            routeDescriptor.themes[site] = {};
            routeDescriptor.themes[site].size = 0;
        }

        //set the descriptor for the theme and load the controller type
        if (!routeDescriptor.themes[site][theme]) {
            routeDescriptor.themes[site][theme] = {};
            routeDescriptor.themes[site].size++;
        }

        //set the controller then lock it down to prevent tampering
        descriptor.controller = Controller;
        routeDescriptor.themes[site][theme][descriptor.method] = Object.freeze(descriptor);

        //only add the descriptor it is new.  We do it here because we need to
        //know that the controller is good.
        if (isNew) {
            //set them in storage
            if (isStatic) {
                staticRoutes[descriptor.path] = routeDescriptor;
            }
            else {
                index[pattern] = storage.length;
                storage.push(routeDescriptor);
            }
        }

        //log the result
        if (isStatic) {
            log.debug('RequestHandler: Registered Static Route - Theme [%s] Path [%s][%s]', theme, descriptor.method, descriptor.path);
        }
        else {
            log.debug('RequestHandler: Registered Route - Theme [%s] Path [%s][%s] Pattern [%s]', theme, descriptor.method, descriptor.path, pattern);
        }
        return true;
    }

    /**
     * Generates a regular expression based on the specified path.  In addition the
     * algorithm extracts any path variables that are included in the path.  Paths
     * can include two types of wild cards.  The traditional glob pattern style of
     * "/some/api/*" can be used as well as path variables ("/some/api/:action").
     * The path variables will be passed to the controllers.
     * @param {String} path The URL path
     * @return {Object|null} An object containing three properties: The specified
     * "path". The generated regular expression "pattern" as a string. Lastly, a
     * hash of the path variables and their position in the path coorelating to its
     * depth in the path.
     */
    static getRoutePattern (path) {
        if (!path) {
            return null;
        }

        //clean up path
        if (path.indexOf('/') === 0) {
            path = path.substring(1);
        }
        if (path.lastIndexOf('/') === path.length - 1) {
            path = path.substring(0, path.length - 1);
        }

        //construct the pattern & extract path variables
        var pathVars    = {};
        var pattern     = '^';
        var hasWildcard = false;
        var pathPieces  = path.split('/');
        for (var i = 0; i < pathPieces.length; i++) {
            var piece = pathPieces[i];

            if (piece.indexOf(':') === 0) {
                var fieldName = piece.substring(1);
                pathVars[fieldName] = i + 1;
                pattern += '\/[^/]+';
            }
            else {
                if (piece.indexOf('*') >= 0) {
                    piece = piece.replace(/\*/g, '.*');

                    hasWildcard = true;
                }
                pattern += '\/'+piece;
            }
        }
        pattern += '[/]{0,1}$';

        return {
            path: path,
            pattern: pattern,
            pathVars: pathVars,
            hasWildcard: hasWildcard
        };
    }

    /**
     *
     * @param {string} urlPath
     * @param {Object} route
     * @param {Object} route.path_vars
     */
    static getPathVariables (urlPath, route) {
        var pathVars = {};
        var pathParts = urlPath.split('/');
        Object.keys(route.path_vars).forEach(function(field) {
            pathVars[field] = pathParts[route.path_vars[field]];
        });
        return pathVars;
    }

    /**
     * Determines if the path is mapped to static resources
     * @param {String} path URL path to a resource
     * @return {Boolean} TRUE if mapped to a public resource directory, FALSE if not
     */
    static isPublicRoute (path) {
        for (var i = 0; i < RouteService.PUBLIC_ROUTE_PREFIXES.length; i++) {
            if (path.indexOf(RouteService.PUBLIC_ROUTE_PREFIXES[i]) === 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * TODO finish removing unresolved functions
     * @param path
     * @param siteUid
     * @returns {*}
     */
    static getRoute (path, siteUid) {

        //check static routes first.  It must be an exact match including
        //casing and any ending slash.
        var isSilly = log.isSilly();
        var route   = RouteService.staticRoutes[path];
        if (!_.isNil(route)) {
            if(route.themes[siteUid] || route.themes[SiteUtils.GLOBAL_SITE]) {
                if (isSilly) {
                    log.silly('RequestHandler: Found static route [%s]', path);
                }
                return route;
            }
        }

        //now do the hard work.  Iterate over the available patterns until a
        //pattern is found.
        for (var i = 0; i < RequestHandler.storage.length; i++) {

            var curr   = RequestHandler.storage[i];
            var result = curr.expression.test(path);

            if (isSilly) {
                log.silly('RequestHandler: Comparing Path [%s] to Pattern [%s] Result [%s]', path, curr.pattern, result);
            }
            if (result) {
                if(curr.themes[siteUid] || curr.themes[SiteUtils.GLOBAL_SITE]) {
                    return curr;
                }
                break;
            }
        }

        //ensures we return null when route is not found for backward
        //compatibility.
        return null;
    }
}

module.exports = RouteService;
