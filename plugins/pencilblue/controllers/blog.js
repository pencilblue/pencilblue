/*
 Copyright (C) 2015  PencilBlue, LLC

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

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Loads a section
     */
    function BlogViewController(){}
    util.inherits(BlogViewController, pb.BaseController);


    BlogViewController.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {

            //get content settings
            var contentService = new pb.ContentService({site: this.site});
            contentService.getSettings(function(err, contentSettings) {
                if (util.isError(err)) {
                    return cb(err);
                }

                //create the service
                self.contentSettings = contentSettings;
                var asContext = self.getServiceContext();
                asContext.contentSettings = contentSettings;
                self.service = new pb.ArticleServiceV2(asContext);

                //create the loader context
                var cvlContext             = self.getServiceContext();
                cvlContext.contentSettings = contentSettings;
                cvlContext.service         = self.service;
                self.contentViewLoader     = new pb.ContentViewLoader(cvlContext);

                cb(null, true);
            });
        };
        BlogViewController.super_.prototype.init.apply(this, [context, init]);
    };

    BlogViewController.prototype.render = function(cb) {
        var self    = this;

        this.getContent(function(err, articles) {
            if (util.isError(err)) {
                return cb(err);
            }

            //render
            var options = {
                useDefaultTemplate: true
            };
            self.contentViewLoader.render(articles, options, function(err, html) {
                if (util.isError(err)) {
                    return cb(err);
                }

                var result = {
                    content: html
                };
                cb(result);
            });
        });
    };

    BlogViewController.prototype.getContent = function(cb) {
        var self = this;

        var opts = {
            render: true,
            limit: self.contentSettings.articles_per_page || 5,
            order: [{'publish_date': pb.DAO.DESC}, {'created': pb.DAO.DESC}]
        };
        self.service.getPublished(opts, cb);
    };

    //exports
    return BlogViewController;
};
