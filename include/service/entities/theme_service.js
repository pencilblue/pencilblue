/*
    Copyright (C) 2016  PencilBlue, LLC

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
'use strict';

function ThemeService(useMemory, useCache) {

	var objType  = 'theme';
	var services = [];

  var options = {
      objType: objType,
      timeout: pb.config.plugins.caching.memory_timeout
  };

  //add in-memory service
	if (useMemory){
		services.push(new pb.MemoryEntityService(options));
	}

	//add cache service
	if (useCache) {
		services.push(new pb.CacheEntityService(options));
	}

	//always add JSON
	services.push(new pb.JSONFSEntityService(objType));
	this.service = new pb.ReadOnlySimpleLayeredService(services, 'ThemeService');
}

//exports
module.exports.ThemeService = ThemeService;
