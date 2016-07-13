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
    var SiteMapService = pb.SiteMapService;
    var ArticleServiceV2 = pb.ArticleServiceV2;
    var PageService = pb.PageService;

    /**
     * Google sitemap
     * @class SiteMap
     * @extends BaseController
     * @constructor
     */
    function SiteMap(){}
    util.inherits(SiteMap, pb.BaseController);

    //constants
    var PARALLEL_LIMIT = 2;

    /**
     * Initializes the controller
     * @method init
     * @param {Object} context
     * @param {Function} cb
     */
    SiteMap.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {

            //build dependencies for site map service
            var articleSerivce = new ArticleServiceV2(self.getServiceContext());
            var pageService = new PageService(self.getServiceContext());
            var context = self.getServiceContext();
            context.articleService = articleSerivce;
            context.pageService = pageService;
            context.supportedLocales = Object.keys(context.siteObj.supportedLocales);

            /**
             *
             * @property service
             * @type {SiteMapService}
             */
            self.service = new SiteMapService(context);

            cb(err, true);
        };
        SiteMap.super_.prototype.init.apply(this, [context, init]);
    };

    SiteMap.prototype.render = function(cb) {
        this.service.getAndSerialize(function(err, xml) {
            if (util.isError(err)) {
                return cb(err);
            }
            cb({
                content: xml,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            });
        });
    };

    //exports
    return SiteMap;
};
