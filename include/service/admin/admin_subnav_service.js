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
 * Provides the ability to manage the admin section's sub-nav.  It manages
 * callbacks for specific areas of the admin section that will build a structure
 * to represent the sub-nav.  This sub nav, when retrieved will combine all
 * registrants' pills into a single structure which can then be rendered in a UI.
 *
 * @module Services
 * @class AdminSubnavService
 * @constructor
 */

/**
 * Services calls for the admin interface
 *
 * @submodule Admin
 */

function AdminSubnavService(){}

//statics
var CALLBACKS = {};

/**
 * Register a callback with the service
 *
 * @method registerFor
 * @param {String}   key            The key to register
 * @param {Function} getSubNavItems The callback function
 */
AdminSubnavService.registerFor = function(key, getSubNavItems) {
	if (!pb.validation.validateNonEmptyStr(key, true) || !pb.utils.isFunction(getSubNavItems)) {
		return false;
	}

	if (CALLBACKS[key] === undefined) {
		CALLBACKS[key] = [];
	}
	CALLBACKS[key].push(getSubNavItems);
	return true;
};

/**
 * Retrieves the sub-nav items
 *
 * @method get
 * @param  {String} key        The key to retrieve
 * @param  {Object} ls         The localization object
 * @param  {String} activePill The name of the active sub-nav pill
 * @param  {Object} [data]     Data object to send to the callback function
 * @return {Object}            The sub-nav items
 */
AdminSubnavService.get = function(key, ls, activePill, data) {
	if (CALLBACKS[key] === undefined || CALLBACKS[key].length === 0) {
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
module.exports = AdminSubnavService;
