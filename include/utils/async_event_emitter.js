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
var AsyncEventEmitterLib = require('async-eventemitter');

module.exports = function(pb) {

    /**
     * @static
     * @class AsyncEventEmitter
     */
    function AsyncEventEmitter(){}

    /**
     * @static
     * @method extend
     * @param {function} prototype
     */
    AsyncEventEmitter.extend = function(prototype) {
        var events = new AsyncEventEmitterLib();

        /**
         * Registers a listener for the specified event.
         * @static
         * @method on
         * @param {String} event
         * @param {Function} listener
         * @return {*}
         */
        prototype.on = function(event, listener) {
            return events.on(event, listener);
        };

        /**
         * Registers a listener to fire a single time for the specfied event
         * @static
         * @method once
         * @param {String} event
         * @param {Function} listener
         * @return {*}
         */
        prototype.once = function(event, listener) {
            return events.once(event, listener);
        };

        /**
         * Removes the listener from the specified event
         * @static
         * @method removeListener
         * @param {String} event
         * @param {Function} listener
         * @return {*}
         */
        prototype.removeListener = function(event, listener) {
            return events.removeListener(event, listener);
        };

        /**
         * Removes all listeners for the specified event
         * @static
         * @method removeAllListeners
         * @param {String} event
         * @return {*}
         */
        prototype.removeAllListeners = function(event) {
            return events.removeAllListeners(event);
        };

        /**
         * Sets the maximum number of listeners for the emitter
         * @static
         * @method setMaxListeners
         * @param {Integer} n
         * @return {EventEmitter}
         */
        prototype.setMaxListeners = function(n) {
            return events.setMaxListeners(n);
        };

        /**
         * Returns a list of the listeners for the specified event
         * @static
         * @method listeners
         * @param {String} event
         * @return {Array}
         */
        prototype.listeners = function(event) {
            return events.listeners(event);
        };

        /**
         *
         * @static
         * @method emit
         * @param {String} event
         * @param {Object} data
         * @param {Function} cb (Error)
         */
        prototype.emit = function(event, data, cb) {
            var listeners = events.listeners(event);
            if (listeners.length === 0) {
                return cb();
            }

            pb.log.silly('AsyncEventEmitter: Emitting events: [%s] to %s listeners', event, listeners.length);
            events.emit(event, data, cb);
        };
    };

    return AsyncEventEmitter;
};
