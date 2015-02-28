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

//dependencies
var util = require('../util.js');

module.exports = function SettingsModule(pb) {
    
    /**
     * SettingServiceFactory - Creates a service that will provide access to settings
     * @class SettingsServiceFactory
     * @constructor
     */
    function SettingServiceFactory(){}

    /**
     * Tracks the number of instances created
     * @private
     * @static
     * @property count
     * @type {Integer}
     */
    var count = 1;

    /**
     * Creates a new instance of the settings service
     * @static
     * @method getService
     * @param {Boolean} useMemory
     * @param {Boolean} useCache
     * @return {SimpleLayeredService}
     */
    SettingServiceFactory.getService = function(useMemory, useCache) {
        var objType    = 'setting';
        var keyField   = 'key';
        var valueField = 'value';
        var services = [];

        //add in-memory service
        if (useMemory){
            var options = {
                objType: objType,
                valueField: valueField,
                keyField: keyField,
                timeout: pb.config.settings.memory_timeout
            };
            services.push(new pb.MemoryEntityService(options));
        }

        //add cache service
        if (useCache) {
            services.push(new pb.CacheEntityService(objType, valueField, keyField));
        }

        //always add db service
        services.push(new pb.DBEntityService(objType, valueField, keyField));

        return new pb.SimpleLayeredService(services, 'SettingService' + count++);
    };

    //exports
    return SettingServiceFactory;
};
