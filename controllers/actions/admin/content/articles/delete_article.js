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
 * Deletes an article
 */
function DeleteArticle(){}

//inheritance
util.inherits(DeleteArticle, pb.BaseController);

DeleteArticle.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;

    var message = this.hasRequiredParams(vars, ['id']);
    if (message) {
        this.formError(message, '/admin/content/articles/manage_articles', cb);
        return;
    }

    var dao = new pb.DAO();
    dao.query('article', {_id: ObjectID(vars['id'])}).then(function(articles) {
        if(articles.length == 0) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/articles/manage_articles', cb);
            return;
        }

        var article = articles[0];
        dao.deleteMatching({_id: ObjectID(vars['id'])}, 'article').then(function(articlesDeleted) {
            if(util.isError(articlesDeleted) || articlesDeleted <= 0) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/articles/manage_articles', cb);
                return;
            }

            self.session.success = article.headline + ' ' + self.ls.get('DELETED');
            self.redirect('/admin/content/articles/manage_articles', cb);
        });
    });
};

//exports
module.exports = DeleteArticle;
