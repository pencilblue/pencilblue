/*
    Copyright (C) 2014  PencilBlue, LLC

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

/**
 * Loads a single article
 */

function Article(){}

//dependencies
var Index = require('./index.js');

//inheritance
util.inherits(Article, Index);


Article.prototype.render = function(cb) {
	var self    = this;
	var custUrl = this.pathVars.customUrl;

	//check for object ID as the custom URL
	var doRedirect = false;
	var where      = null;
	try {
		where      = {_id: pb.DAO.getObjectID(custUrl)};
		doRedirect = true;
	}
	catch(e){
		if (pb.log.isSilly()) {
			pb.log.silly("ArticleController: The custom URL was not an object ID [%s].  Will now search url field. [%s]", custUrl, e.message);
		}
	}

	// fall through to URL key
	if (where === null) {
		where = {url: custUrl};
	}

	//attempt to load object
	var dao = new pb.DAO();
	dao.loadByValues(where, 'article', function(err, article) {
		if (util.isError(err) || article == null) {
			self.reqHandler.serve404();
			return;
		}
		else if (doRedirect) {
			self.redirect(pb.UrlService.urlJoin('/article', article.url), cb);
			return;
		}

		self.req.pencilblue_article = article._id.toString();
		this.article = article;
        self.setPageName(article.name);
		Article.super_.prototype.render.apply(self, [cb]);
	});
};

//exports
module.exports = Article;
