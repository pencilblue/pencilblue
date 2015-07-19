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
var fs     = require('fs');
var path   = require('path');
var locale = require('locale');
var util   = require('./util.js');

module.exports = function LocalizationModule(pb) {
    
    //pb dependencies
    var config = pb.config;

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
        
        //expected to be lowercase and of the form "en-us"
        this.language = Localization.best(request).toString();
    }

    /**
     * 
     * @static
     * @readonly
     * @property SEP
     * @type {String}
     */
    Localization.SEP = '^';
    
    /**
     * 
     * @static
     * @readonly
     * @property PREFIX
     * @type {String}
     */
    Localization.PREFIX = Localization.SEP + 'loc_';
    
    /**
     * 
     * @static
     * @readonly
     * @property ACCEPT_LANG_HEADER
     * @type {String}
     */
    Localization.ACCEPT_LANG_HEADER = 'accept-language';

    /**
     * 
     * @static
     * @readonly
     * @property storage
     * @type {Object}
     */
    Localization.storage   = {};
    
    /**
     * 
     * @static
     * @readonly
     * @property supported
     * @type {Locale}
     */
    Localization.supported = null;

    /**
     * Localizes a string by searching for keys within the template and replacing
     * them with the specified values.
     *
     * @method localize
     * @param {array} sets The localizations sets to search in
     * @param {string} text The text to localize
     * @return {string} The text where keys have been replaced with translated values
     */
    Localization.prototype.localize = function(sets, text){
        if (pb.log.isSilly()) {
            pb.log.silly('Localization: Localizing text - Locale [%s] Sets %s', this.language, JSON.stringify(sets));
        }

        //get i18n from storage
        var loc = Localization.storage[this.language];
        if (util.isNullOrUndefined(loc)) {
            throw new Error("Failed to set a language. LANG="+util.inspect(this.language));
        }
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
            text = text.concat(pb.ClientJs.includeJS(pb.UrlService.createSystemUrl('api/localization/script?locale=' + this.language)));
        }

        return text;
    };

    /**
     * Translates a single key.  The function accepts a variable number of 
     * parameters.  The first must be the key to be localized.  The rest are 
     * considered to be injectable values.  The function will call "util.format" in 
     * situations where the key is found and the nuber of arguments passed to the 
     * function is greater than 1.  See 
     * http://nodejs.org/api/util.html#util_util_format_format for details on 
     * suppored formatting.
     *
     * @method get
     * @param {String} key
     * @param {String|Integer|Float|Object} [args] The variable number of 
     * parameters to be injected into the localization value
     * @return {string} The formatted and localized string
     */
    Localization.prototype.get = function() {
        var key = arguments[0];
        if (pb.log.isSilly()) {
            pb.log.silly('Localization: Localizing key [%s] - Locale [%s]', key, this.language);
        }

        //error checking
        if (!pb.validation.isNonEmptyStr(key, true)) {
            return null;
        }

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
            
            var defaultLocale = Localization.getDefaultLocale().toLocaleLowerCase();
            if (this.language === defaultLocale) {
                return val = key;
            }
            else {
                //TODO keep going down available languages
                //fall back to default language
                var localization = new Localization(defaultLocale);
                return localization.get.apply(localization, arguments);
            }
        }
        else if (arguments.length > 1){
            arguments[0] = val;
            val = util.format.apply(util, arguments);
        }
        return val;
    };

    /**
     * Determines the best language to send a user based on the 'accept-language'
     * header in the request
     *
     * @method best
     * @param {Object} request The request object
     * @return {string} Locale for the request
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

        //create path to localization directory
        var localizationDir = path.join(pb.config.docRoot, 'public', 'localization');
        var files = fs.readdirSync(localizationDir);
        files.forEach(function(file) {
            if (file === '.' || file === '..') {
                return;   
            }

            //check extension
            var ext   = '';
            var index = file.lastIndexOf('.');
            if (index >= 0) {
                ext = file.substring(index);
            }
            if (ext != '.js') {
                return;
            }

            //parse the file
            var obj          = {generic: {}};
            var absolutePath = path.join(localizationDir, file);
            try {
                obj = require(absolutePath);
            }
            catch(e) {
                pb.log.warn('Localization: Failed to load core localization file [%s]. %s', absolutePath, e.stack);
            }

            //convert file name to locale
            var locale = file.toLowerCase().substring(0, file.indexOf('.'));

            //Register as a supported language
            Localization.storage[locale] = obj;
            supportedLocales.push(locale);
        });

        //set the supported locales
        pb.log.debug("Localization: Supporting - " + JSON.stringify(supportedLocales));
        Localization.supported = new locale.Locales(supportedLocales);
    };

    /**
     *
     * @static
     * @method isSupported
     * @param {String} locale
     * @return {Boolean}
     */
    Localization.isSupported = function(locale) {
        if (!locale) {
            return false;
        }
        return Localization.getLocalizationPackage(locale) ? true : false;
    };

    /**
     *
     * @static
     * @method getLocalizationPackage
     * @param {String} locale
     * @return {Object}
     */
    Localization.getLocalizationPackage = function(locale) {
        if (!pb.validation.isNonEmptyStr(locale, true)) {
            return null;
        }
        return Localization.storage[locale.toLowerCase()] || null;
    };

    /**
     *
     * @static
     * @method registerLocalizations
     * @param {String} locale
     * @param {Object} localizations
     * @return {Boolean}
     */
    Localization.registerLocalizations = function(locale, localizations) {
        if (!Localization.isSupported(locale) || !util.isObject(localizations)) {
            return false;
        }
        
        util.forEach(localizations, function(item, key) {
            Localization.registerLocalization(locale, key, item);
        });
        return true;
    };

    /**
     *
     * @static
     * @method registerLocalization
     * @param {String} locale
     * @param {String} key
     * @param {String} value
     * @return {Boolean}
     */
    Localization.registerLocalization = function(locale, key, value) {
        if (!Localization.isSupported(locale)) {
            return false;
        }
        else if (!util.isString(key) || !util.isString(value)) {
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
       
    /**
     * Retrieves the default locale for the instance.  It first inspects the 
     * Configuration property localization.defaultLocale.  As a last resort it 
     * will fall back to english. The locale is expected to be of the form: 
     * [language code]_[country code]
     * @static
     * @method getDefaultLocale
     * @return {String} The default locale
     */
    Localization.getDefaultLocale = function() {
        return config.localization.defaultLocale || 'en-US';
    };
    
    /**
     * Retrieves the supported locales
     * @static
     * @method getSupported
     * @return {Array}
     */
    Localization.getSupported = function() {
        return util.clone(Localization.supported);
    };
    
    /**
     * Retrieves the supported locales as an array where each item in the array 
     * contains a value (locale) and a name (locale specific representation of 
     * the locale).
     * @static
     * @method getSupportedWithDisplay
     * @return {Array}
     */
    Localization.getSupportedWithDisplay = function() {
        var locales = [];
        var supported = Localization.getSupported();
        supported.forEach(function(locale) {

            var package = Localization.getLocalizationPackage(locale);
            if (!util.isObject(package)) {
                return;
            }

            var kv = {
                value: locale,
                name: package.generic.LOCALE_DISPLAY
            };
            locales.push(kv);
        });
        return locales;
    };
    
    return Localization;
};
