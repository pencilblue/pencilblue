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

var util = require('../../util.js');

module.exports = function AdminSubnavServiceModule(pb) {

    /**
     * Provides the ability to manage the admin section's sub-nav.  It manages
     * callbacks for specific areas of the admin section that will build a structure
     * to represent the sub-nav.  This sub nav, when retrieved will combine all
     * registrants' pills into a single structure which can then be rendered in a UI.
     *
     * @module Services
     * @class AdminSubnavService
     * @constructor
     */
    function AdminSubnavService(){}

    /**
     *
     * @private
     * @static
     * @property CALLBACKS
     * @type {Object}
     */
    var CALLBACKS = {};

    /**
     * Register a callback with the service
     * @static
     * @method registerFor
     * @param {String}   key            The key to register
     * @param {Function} getSubNavItems The callback function
     */
    AdminSubnavService.registerFor = function(key, getSubNavItems) {
        if (!pb.validation.validateNonEmptyStr(key, true) || !util.isFunction(getSubNavItems)) {
            return false;
        }

        if (util.isNullOrUndefined(CALLBACKS[key])) {
            CALLBACKS[key] = [];
        }
        else if (CALLBACKS[key].indexOf(getSubNavItems) > -1) {
            return true;
        }
        else {
            //hack in place until PB theme controllers are moved over or admin sub nav is URL based
            //ensures that functions are only registered once by using a string comparison
            var funcStr = getSubNavItems.toString();
            for (var i = 0; i < CALLBACKS[key].length; i++) {
                if (CALLBACKS[key][i].toString() === funcStr) {
                    return true;
                }
            }
        }

        CALLBACKS[key].push(getSubNavItems);
        return true;
    };

    /**
     * Unregisters a callback function
     * @static
     * @method unregisterFor
     * @param {String} key
     * @param {Function} Function to unregister
     * @return {Boolean} TRUE if function was unregistered, FALSE if not
     */
    AdminSubnavService.unregisterFor = function(key, registeredFunc) {
        if (!pb.validation.validateNonEmptyStr(key, true) || !util.isFunction(registeredFunc)) {
            return false;
        }
        else if (!util.isArray(CALLBACKS[key])) {
            return false;
        }

        var index = CALLBACKS[key].indexOf(registeredFunc);
        if (index > -1) {
            CALLBACKS[key].splice(index, 1);
            return true;
        }
        return false;
    };

    /**
     * Retrieves the sub-nav items
     * @static
     * @method get
     * @param  {String} key        The key to retrieve
     * @param  {Object} ls         The localization object
     * @param  {String} activePill The name of the active sub-nav pill
     * @param  {Object} [data]     Data object to send to the callback function
     * @return {Object}            The sub-nav items
     */
    AdminSubnavService.get = function(key, ls, activePill, data) {
        if (!util.isArray(CALLBACKS[key]) || CALLBACKS[key].length === 0) {
            return [];
        }

        var navItems = [];
        for(var i = 0; i < CALLBACKS[key].length; i++) {

            var items = CALLBACKS[key][i](key, ls, data);
            if (util.isArray(items)) {

                for (var j = 0; j < items.length; j++) {
                    if (items[j] && items[j].name === activePill) {
                        items[j].active = 'active';
                    }
                    navItems.push(items[j]);
                }
            }
        }
        return navItems;
    };

    //exports
    return AdminSubnavService;
};
