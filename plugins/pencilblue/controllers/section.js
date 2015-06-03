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

module.exports = function SectionModule(pb) {
    
    //pb dependencies
    var util  = pb.util;

    /**
     * Loads a section
     */
    function Section(){}
    util.inherits(Section, pb.BaseController);


    Section.prototype.init = function(context, cb) {
        var self = this;
        var init = function(err) {
            //get content settings
            var serviceContext = self.getServiceContext();
            var contentService = new pb.ContentService(self.site, serviceContext.onlyThisSite);
            contentService.getSettings(function(err, contentSettings) {
                if (util.isError(err)) {
                    return cb(err);
                }
                //create the service
                self.contentSettings = contentSettings;
                self.service         = new pb.ArticleServiceV2(serviceContext);
                
                //create the loader context
                var context = util.merge(serviceContext, {
                    service: self.service,
                    contentSettings: contentSettings
                });

                self.contentViewLoader = new pb.ContentViewLoader(context);
                self.dao     = new pb.DAO();
                
                cb(null, true);
            });
        };
        Section.super_.prototype.init.apply(this, [context, init]);
    };
    
    Section.prototype.render = function(cb) {
        var self    = this;
        var custUrl = this.pathVars.customUrl;
        
        this.getContent(custUrl, function(err, data) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (!util.isObject(data)) {
                return self.reqHandler.serve404();
            }
            
            var options = {
                section: data.section
            };
            self.contentViewLoader.render(data.content, options, function(err, html) {
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
    
    Section.prototype.getContent = function(custUrl, cb) {
        var self = this;
            
        self.dao.loadByValue('url', custUrl, 'section', function(err, section) {
            if (util.isError(err) || section == null) {
                return cb(null, null);
            }

            var opts = {
                render: true,
                where: {},
                limit: self.contentSettings.articles_per_page || 5,
                order: [{'publish_date': pb.DAO.DESC}, {'created': pb.DAO.DESC}]
            };
            pb.ArticleServiceV2.setPublishedClause(opts.where);
            self.service.getBySection(section, opts, function(err, content) {
                var result = {
                    section: section,
                    content: content
                };
                cb(err, result);
            });
        });
    };

    //exports
    return Section;
};
