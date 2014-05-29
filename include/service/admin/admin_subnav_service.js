/**
 * Provides the ability to manage the admin section's sub-nav.  It manages 
 * callbacks for specific areas of the admin section that will build a structure 
 * to represent the sub-nav.  This sub nav, when retrieved will combine all 
 * registrants' pills into a single structure which can then be rendered in a UI.
 * 
 * @author Brian Hyder <brian@pencilblue.org>
 * @copyright PencilBlue 2014, All rights reserved
 * @class AdminSubnavService
 * @constructor
 */
function AdminSubnavService(){}

//statics
var CALLBACKS = {};

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
