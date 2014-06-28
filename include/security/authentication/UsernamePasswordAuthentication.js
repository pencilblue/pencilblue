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

function UsernamePasswordAuthentication() {}

UsernamePasswordAuthentication.prototype.authenticate = function(credentials, cb) {
	if (!pb.utils.isObject(credentials) || !pb.utils.isString(credentials.username) || !pb.utils.isString(credentials.password)) {
		cb(new Error("UsernamePasswordAuthentication: The username and password must be passed as part of the credentials object: "+credentials), null);
		return;
	}

	//build query
	var query = {
		object_type : 'user',
		'$or' : [
	        {
	        	username : credentials.username
	        },
	        {
	        	email : credentials.username
	        }
        ],
		password : credentials.password
	};

	//check for required access level
	if (!isNaN(credentials.access_level)) {
		query.admin = {
			'$gte': credentials.access_level
		};
	}

	//search for user
	var dao = new pb.DAO();
	dao.loadByValues(query, 'user', cb);
};

//exports
module.exports = UsernamePasswordAuthentication;
