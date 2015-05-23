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

module.exports = function ArticleModule(pb) {
    
    //pb dependencies
    var util  = pb.util;
    var Index = require('./index.js')(pb);
    
    /**
     * Loads a single article
     */
    function Article(){}
    util.inherits(Article, Index);


    Article.prototype.render = function(cb) {
        var self    = this;
        var custUrl = this.pathVars.customUrl;
        
        //attempt to load object
        var opts = {
            render: true,
            where: this.getWhereClause(custUrl)
        };
        var service = new pb.ArticleServiceV2();
        service.getSingle(opts, function(err, article) {
            if (util.isError(err)) {
                return cb(err);
            }
            else if (article == null) {
                return self.reqHandler.serve404();   
            }

            //retrieve content settings
            var contentService = new pb.ContentService();
            contentService.getSettings(function(err, contentSettings) {
                if (util.isError(err)) {
                    return cb(err);
                }
                
                var context = {
                    contentSettings: contentSettings,
                    service: service,
                    session: self.session,
                    req: self.req,
                    ts: self.ts,
                    ls: self.ls
                };
                var contentViewLoader = new pb.ContentViewLoader(context);
                
                var options = {};
                contentViewLoader.render([article], options, function(err, html) {
                    if (util.isError(err)) {
                        return cb(err);
                    }
                    
                    var result = {
                        content: html
                    };
                    cb(result);
                });
            });
        });
    };
    
    Article.prototype.getWhereClause = function(custUrl) {
        
        //check for object ID as the custom URL
        var where  = null;
        if(pb.validation.isIdStr(custUrl, true)) {
            where = pb.DAO.getIdWhere(custUrl);
        }
        else {
            where = {
                url: custUrl
            };
        }
        return where;
    };

    //exports
    return Article;
};
