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
 * Checks to see if the proposed name for a custom object type is available
 */

function GetObjectTypeNameAvailable(){}

//inheritance
util.inherits(GetObjectTypeNameAvailable, pb.FormController);

GetObjectTypeNameAvailable.prototype.render = function(cb) {
	var self = this;
	var get = this.query;

	if(!get['name'] || get['name'].length == 0)
	{
	    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'name was not passed')});
        return;
	}

    var dao = new pb.DAO();
    dao.query('custom_object_type', pb.DAO.ANYWHERE, pb.DAO.PROJECT_ALL).then(function(customObjectTypes) {
		if (util.isError(customObjectTypes)) {
			//TODO handle this
		}

		//none to manage
        if(customObjectTypes.length == 0) {
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, get['name'] + ' is available', true)});
            return;
        }

        // Case insensitive test for duplicate name
        for(var i =0; i < customObjectTypes.length; i++)
        {
            if(get['name'].toLowerCase() == customObjectTypes[i].name.toLowerCase())
            {
                cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, get['name'] + ' is not available', false)});
                return;
            }
        }

        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, get['name'] + ' is available', true)});
        return;
    });
};

//exports
module.exports = GetObjectTypeNameAvailable;
