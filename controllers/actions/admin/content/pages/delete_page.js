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
        cb({
			code: 400,
			content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, message)
		});
		return;
    }

    var dao = new pb.DAO();
    dao.query('page', {_id: ObjectID(vars.id)}).then(function(pages) {
        if(pages.length === 0) {
            cb({
				code: 400,
				content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
			});
			return;
        }

        var page = pages[0];
        dao.deleteMatching({_id: ObjectID(vars.id)}, 'page').then(function(pagesDeleted) {
            if(util.isError(pagesDeleted) || pagesDeleted <= 0) {
                cb({
					code: 500,
					content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETING'))
				});
				return;
            }

			cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, page.headline + ' ' + self.ls.get('DELETED'))});
        });
    });
};

//exports
module.exports = DeletePage;
