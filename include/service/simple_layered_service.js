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
var async = require('async');
var util  = require('../util.js');

module.exports = function SimpleLayeredServiceModule(pb) {

    /**
     * Service for layering storage services
     *
     * @module Services
     * @submodule Storage
     * @class SimpleLayeredService
     * @constructor
     * @param {Array} services Array of services
     * @param {String} [name]  The name to assign to this service
     */
    function SimpleLayeredService(services, name){
        this.services = services;
        this.name     = name ? name : 'SimpleLayeredService';
    }

    /**
     * Retrieves the setting value from various storage areas.
     *
     * @method get
     * @param {String} key
     * @param {Object} cb Callback function
     */
    SimpleLayeredService.prototype.get = function(key, cb){

        var i              = 0;
        var resultNotFound = true;
        var entity         = null;
        var instance       = this;
        async.whilst(
            function() { //while
                return i < instance.services.length && resultNotFound;
            },
            function(callback) {//do
                if (pb.log.isSilly()) {
                    pb.log.silly('%s: Checking Service [%s] for key [%s]', instance.name, instance.services[i].type, key);
                }

                instance.services[i].get(key, function(err, result){
                    if (util.isError(err)){
                        resultNotFound = false;
                        callback(err);
                        return;
                    }

                    if (result || (typeof result === 'boolean' && result === false)) {
                        resultNotFound = false;
                        entity         = result;
                    }
                    else{
                        i++;
                    }

                    callback();
                });
            },
            function(err){//when done

                if (entity) {

                    //set value in services that didn't have it.
                    for (var j = 0; j < i; j++) {
                        if (instance.services[j]._set) {
                            instance.services[j]._set(key, entity, util.cb)
                        }
                        else {
                           instance.services[j].set(key, entity, util.cb);
                        }
                    }
                }

                //callback to original caller
                cb(err, entity);
            }
        );
    };

    /**
     * Persists a new value for the setting.  When the setting does not exist a new
     * one is created.
     *
     * @method set
     * @param {String} key
     * @param {*}      value
     * @param cb       Callback function
     */
    SimpleLayeredService.prototype.set = function(key, value, cb){
        var self = this;

        var tasks = [];
        for (var i = this.services.length -1; i >= 0; i--){
            var task = function(index){
                return function(callback) {
                    if (pb.log.isSilly()) {
                        pb.log.silly("%s:%s: Setting [%s] Value %s", self.name, self.services[index].type, key, JSON.stringify(value));
                    }
                    self.services[index].set(key, value, callback);
                };
            };
            tasks.push(task(i));
        }
        async.series(tasks, cb);
    };

    /**
     * Removes the value from storage.
     *
     * @method purge
     * @param {String} key
     * @param cb       Callback function
     */
    SimpleLayeredService.prototype.purge = function(key, cb){
        var tasks = util.getTasks(this.services, function(services, i) {
            return function(callback) {
                services[i].purge(key, callback);
            };
        });
        async.series(tasks, cb);
    };

    return SimpleLayeredService;
};
