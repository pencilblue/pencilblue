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

//dependencies
var SimpleLayeredService = require('./simple_layered_service');

/**
 * Service to set storage services as read only
 * TODO [1.0] check for references to be removed
 * @module Services
 * @submodule Storage
 * @class ReadOnlySimpleLayeredService
 * @constructor
 * @param {Array} services Array of services
 * @param {String} [name]  The name to assign to this service
 */
class ReadOnlySimpleLayeredService extends SimpleLayeredService {
    constructor(services, name) {
        super();
        this.services = services;
        this.name = name ? name : 'ReadOnlySimpleLayeredService';

        //convert services
        for (var i = 0; i < this.services.length; i++) {
            ReadOnlySimpleLayeredService.makeReadOnly(this.services[i]);
        }
    }

    /**
     *
     * @method set
     * @param {String} key
     * @param {*} value
     * @param {Function} cb
     */
    set(key, value, cb) {
        cb(new Error(this.name + ": This service is readonly"), null);
    }

    /**
     *
     * @static
     * @method makeReadOnly
     * @param {EntityService} serviceInstance
     */
    static makeReadOnly(serviceInstance) {
        serviceInstance.set = function (key, value, cb) {
            cb(new Error(this.name + ": This service is readonly"), null);
        };
    }
}

module.exports = ReadOnlySimpleLayeredService;
