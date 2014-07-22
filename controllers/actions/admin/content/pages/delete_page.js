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
 * Deletes a page
 */

function DeletePage(){}

//inheritance
util.inherits(DeletePage, pb.BaseController);

DeletePage.prototype.render = function(cb) {
	var self = this;
	var vars = this.pathVars;

    var message = this.hasRequiredParams(vars, ['id']);
    if (message) {
        this.formError(message, '/admin/content/pages/manage_pages', cb);
        return;
    }

    var dao = new pb.DAO();
    dao.query('page', {_id: ObjectID(vars.id)}).then(function(pages) {
        if(pages.length === 0) {
            self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/pages/manage_pages', cb);
            return;
        }

        var page = pages[0];
        dao.deleteMatching({_id: ObjectID(vars.id)}, 'page').then(function(pagesDeleted) {
            if(util.isError(pagesDeleted) || pagesDeleted <= 0) {
                self.formError(self.ls.get('ERROR_SAVING'), '/admin/content/pages/manage_pages', cb);
                return;
            }

            self.session.success = page.headline + ' ' + self.ls.get('DELETED');
            self.redirect('/admin/content/pages/manage_pages', cb);
        });
    });
};

//exports
module.exports = DeletePage;
