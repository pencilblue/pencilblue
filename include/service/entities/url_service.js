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

//dependencies
var _ = require('lodash');
var RegExpUtils = require('../../utils/reg_exp_utils');
var RequestHandler = require('../../http/request_handler');
var SiteQueryService = require('./site_query_service');
var SiteService = require('./site_service');
var url  = require('url');

    /**
     * A service that provides insight into the system's routes (URLs) along with
     * other utility functions to assist in examining and constructing URLs for
     * clients to use for interaction with the system.
     *
     * @class UrlService
     * @constructor
     * @module Services
     * @submodule Entities
     */
    function UrlService(site, onlyThisSite) {
        this.site = SiteService.getCurrentSite(site);
        this.onlyThisSite = onlyThisSite;
        this.siteQueryService = new SiteQueryService({site: this.site, onlyThisSite: this.onlyThisSite});
    }

    /**
     * Takes the URL path and tests it against registered routes.
     * @static
     * @method exists
     * @param {string} url
     * @return  {object} The themed route specification for the first route that
     * matches the given URL path.  When no routes match NULL is returned.
     */
    UrlService.exists = function(url){

        var themes = null;
        for (var i = 0; i < RequestHandler.storage.length; i++) {
            var curr   = RequestHandler.storage[i];
            var result = curr.expression.test(url);
            if (result) {
                themes = _.clone(curr.themes);
                break;
            }
        }
        return themes;
    };

    /**
     * Look at a specific content type to see if a matching URL key exists.  An
     * optional ID can be provided to ensure that only an existing key for the
     * object with that ID exists.
     * @method existsForType
     * @param {object} params Contains the options for the function.  "url"
     * (string) and "type" (string) are required.  "id" (string) is optional.
     * @param {function} cb Callback function
     */
    UrlService.prototype.existsForType = function(params, cb) {
        var url  = params.url;
        var type = params.type;
        var id   = params.id;
        var site = params.site;

        //validate required params
        if (!url || !type) {
            return cb(new Error("The url and type parameters are required. URL=["+url+"] TYPE=["+type+"]"), false);
        }

        //build pattern
        if (url.charAt(0) === '/') {
            url = url.substring(1);
        }
        if (url.charAt(url.length - 1) === '/') {
            url = url.substring(0, url.length - 1);
        }
        var pattern = "^\\/{0,1}" + RegExpUtils.escapeRegExp(url) + "\\/{0,1}$";
        var where = {
            url: new RegExp(pattern, "i")
        };
        if (site !== undefined) {
            where[SiteService.SITE_FIELD] = site;
        }
        this.siteQueryService.unique(type, where, id, function(err, isUnique) {
            cb(err, !isUnique);
        });
    };

    //exports
    module.exports = UrlService;
