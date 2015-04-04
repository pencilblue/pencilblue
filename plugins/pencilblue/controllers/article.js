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

        //check for object ID as the custom URL
        var where  = null;
        if(pb.validation.isIdStr(custUrl)) {
            where = {_id: pb.DAO.getObjectID(custUrl)};
            if (pb.log.isSilly()) {
                pb.log.silly("ArticleController: The custom URL was not an object ID [%s].  Will now search url field. [%s]", custUrl, e.message);
            }
        }
        else {
            where = {url: custUrl};
        }

        // fall through to URL key
        if (where === null) {
            where = {url: custUrl};
        }
        
        //attempt to load object
        var dao = new pb.DAO();
        dao.loadByValues(where, 'article', function(err, article) {
            if (util.isError(err) || article == null) {
                if (where.url) {
                    self.reqHandler.serve404();
                    return;
                }

                dao.loadByValues({url: custUrl}, 'article', function(err, article) {
                    if (util.isError(err) || article == null) {
                        self.reqHandler.serve404();
                        return;
                    }

                    self.renderArticle(article, cb);
                });

                return;
            }

            self.renderArticle(article, cb);
        });
    };
    
    Article.prototype.renderArticle = function(article, cb) {
        this.req.pencilblue_article = article._id.toString();
        this.article = article;
        this.setPageName(article.name);
        Article.super_.prototype.render.apply(this, [cb]);
    };

    //exports
    return Article;
};
