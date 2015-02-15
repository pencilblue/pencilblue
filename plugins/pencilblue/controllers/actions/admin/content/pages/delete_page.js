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
    dao.loadById(vars.id, 'page', function(err, page) {
        if (util.isError(err)) {
            return cb({
				code: 500,
				content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, err.stack)
			});
        }
        else if(!page) {
            cb({
				code: 404,
				content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('INVALID_UID'))
			});
			return;
        }

        //remove from persistence
        dao.deleteById(vars.id, 'page', function(err, pagesDeleted) {
            if(util.isError(err) || pagesDeleted <= 0) {
                return cb({
					code: 500,
					content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, self.ls.get('ERROR_DELETING'))
				});
            }

			cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, page.headline + ' ' + self.ls.get('DELETED'))});
        });
    });
};

//exports
module.exports = DeletePage;
