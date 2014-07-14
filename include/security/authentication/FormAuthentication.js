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

function FormAuthentication() {}

//dependencies
var UsernamePasswordAuthentication = pb.UsernamePasswordAuthentication;

//inheritance
util.inherits(FormAuthentication, UsernamePasswordAuthentication);

FormAuthentication.prototype.authenticate = function(postObj, cb) {
	if (!pb.utils.isObject(postObj)) {
		cb(new Error("FormAuthentication: The postObj parameter must be an object: "+postObj), null);
		return;
	}

	//call the parent function
	var userDocument = pb.DocumentCreator.create('user', postObj);
	FormAuthentication.super_.prototype.authenticate.apply(this, [userDocument, cb]);
};

//exports
module.exports = FormAuthentication;
