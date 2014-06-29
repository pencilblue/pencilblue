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
 * Provides functions to translate items based on keys.  Also
 * assists in the determination of the best language for the given user.
 *
 * @module Services
 * @class Localization
 * @constructor
 * @param {Object} request The request object
 */
function Localization(request){
	this.language = Localization.best(request).toString().toLowerCase().replace('-', '_');
}

Localization.SEP                = '^';
Localization.PREFIX             = Localization.SEP + 'loc_';
Localization.ACCEPT_LANG_HEADER = 'accept-language';

Localization.storage   = {};
Localization.supported = null;

/**
 * Localizes a string by searching for keys within the template and replacing
 * them with the specified values.
 *
 * @method localize
 * @param {array} sets The localizations sets to search in
 * @param {string} text The text to localize
 * @returns {string} The text where keys have been replaced with translated values
 */
Localization.prototype.localize = function(sets, text){
	if (pb.log.isSilly()) {
		pb.log.silly('Localization: Localizing text - Locale ['+this.language+'] Sets '+JSON.stringify(sets));
	}

	//get i18n from storage
	var loc = Localization.storage[this.language];if (loc === undefined) {throw new Error("Failed to set a language. LANG="+util.inspect(this.language));}
    for (var key in loc.generic) {
        text = text.split('^loc_' + key + '^').join(loc.generic[key]);
    }

    for (var i = 0; i < sets.length; i++) {
        for(var key in loc[sets[i]])  {
            text = text.split('^loc_' + key + '^').join(loc[sets[i]][key]);
        }
    }

    // If the localization is for HTML output, load the localization into client side JS
    if (text.indexOf('<body') > -1)  {
        text = text.concat(pb.js.includeJS(pb.config.siteRoot + '/localization/' + localizationLanguage + '.js'));
    }

    return text;
};

/**
 * Translates a single key.  The key should not be enclosed by the special '^'
 * character.
 *
 * @method get
 * @param {string} key
 * @param {string} defaultVal The default value to return if the value can't be found
 * @returns {string}
 */
Localization.prototype.get = function(key, defaultVal) {
	if (pb.log.isSilly()) {
		pb.log.silly('Localization: Localizing key ['+key+'] - Locale ['+this.language+']');
	}

	//error checking
	if (typeof key !== 'string') {
		return null;
	}

	//check for old style key
	key = key.replace('^loc_', '').replace('^', '');

	//get i18n from storage
	var tmp;
	var val = null;
	var loc = Localization.storage[this.language];
	for (var category in loc) {
		tmp = loc[category][key];
		if (tmp !== undefined) {
			val = tmp;
			break;
		}
	}

	if (val === null) {
		val = defaultVal ? defaultVal : key;
	}
	return val;
};

/**
 * Determines the best language to send a user based on the 'accept-language'
 * header in the request
 *
 * @method best
 * @param {Object} request The request object
 * @returns {string} Locale for the request
 */
Localization.best = function(request){
	var loc = 'en-us';
	if (request) {
		if (typeof request == 'string') {
			var locales = new locale.Locales(request);
			loc = locales.best(Localization.supported);
		}
		else if (request.headers[Localization.ACCEPT_LANG_HEADER]){
			var locales = new locale.Locales(request.headers[Localization.ACCEPT_LANG_HEADER]);
			loc = locales.best(Localization.supported);
		}
	}
	return loc;
};

/**
 * Initializes the location.  Loads all language packs into memory for fast
 * retrieval and sets the supported locales for determining what language to
 * send the user based on their list of acceptable languages.
 *
 * @method init
 */
Localization.init = function() {
	var supportedLocales = [];
	Localization.storage = {};
	for (var i = 0; i < pb.config.locales.supported.length; i++) {

		var obj              = {generic: {}};
		var localeDescriptor = pb.config.locales.supported[i];
		try {
			obj = require(localeDescriptor.file);
		}
		catch(e) {
			pb.log.warn('Localization: Failed to load core localization file [%s]. Localization may be provided by a plugin', localeDescriptor.file);
		}
		Localization.storage[localeDescriptor.locale.toLowerCase()] = obj;
		supportedLocales.push(localeDescriptor.locale);
	}

	pb.log.debug("Localization: Supporting - " + JSON.stringify(supportedLocales));
	Localization.supported = new locale.Locales(supportedLocales);
};

Localization.isSupported = function(locale) {
	if (!locale) {
		return false;
	}
	return Localization.getLocalizationPackage(locale) !== undefined;
};

Localization.getLocalizationPackage = function(locale) {
	if (!locale) {
		return null;
	}
	return Localization.storage[locale.replace('-', '_').toLowerCase()];
};

Localization.registerLocalizations = function(locale, localizations) {
	if (!Localization.isSupported(locale)) {
		return false;
	}
	for (var key in localizations) {
		Localization.registerLocalization(locale, key, localizations[key]);
	}
	return true;
};

Localization.registerLocalization = function(locale, key, value) {
	if (!Localization.isSupported(locale)) {
		return false;
	}
	else if (typeof key !== 'string' || typeof value !== 'string') {
		return false;
	}

	var wasSet    = false;
	var localeObj = Localization.getLocalizationPackage(locale);
	for (var localizationArea in localeObj) {

		if (localeObj[localizationArea][key] !== undefined) {
			localeObj[localizationArea][key] = value;
			wasSet = true;
			break;
		}
	}

	//the key was not already found in the core set so just add it to the
	//generic block.  All plugin localizations will end up here.
	if (!wasSet) {
		localeObj.generic[key] = value;
	}
	return true;
};

//exports
module.exports.Localization = Localization;
