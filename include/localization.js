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
var Locale = require('locale');
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
        this.localeObj = Localization.parseLocaleStr(this.language);
        
        /**
         * Stores the keys already retrieved for the instance to prevent duplicate retrieval.
         * @property cache
         * @type {Object}
         */
        this.cache = {};
    }
    
    /**
     *
     * @property JS_EXT
     * @type {String}
     */
    var JS_EXT = '.js';

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
     * @property LOCALE_PART_SEP
     * @type {String}
     */
    Localization.LOCALE_PART_SEP = '-';
    
    /**
     *
     * @static
     * @readonly
     * @property KEY_SEP
     * @type {String}
     */
    Localization.KEY_SEP = '.';

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
     * @type {Locales}
     */
    Localization.supported = null;
    
    /**
     * @static
     * @readonly
     * @property supportedLookup
     * @type {Object}
     */
    Localization.supportedLookup = {};
    
    /**
     * @static
     * @readonly
     * @property keys
     * @type {Object}
     */
    Localization.keys = {};
    
    /**
     * @static
     * @readonly
     * @property PARAM_REPLACEMENT_REGEX
     * @type {RegExp}
     */
    Localization.PARAM_REPLACEMENT_REGEX = /{([^{}]*)}/g;

    /**
     * Localizes a string by searching for keys within the template and replacing
     * them with the specified values.
     *
     * @method localize
     * @param {array} sets The localizations sets to search in
     * @param {string} text The text to localize
     * @param {string} hostname The current hostname
     * @return {string} The text where keys have been replaced with translated values
     */
    Localization.prototype.localize = function(sets, text, hostname){
        if (pb.log.isSilly()) {
            pb.log.silly('Localization: Localizing text - Locale [%s] Sets %s', this.language, JSON.stringify(sets));
        }

        //get i18n from storage
        var loc = Localization.storage;
        if (util.isNullOrUndefined(loc)) {
            throw new Error("Failed to set a language. LANG="+util.inspect(this.language));
        }
        for (var key in loc.generic) {
            var genericVal = this.g('generic' + Localization.KEY_SEP + key, {}, {});
            text = text.split('^loc_' + key + '^').join(genericVal);
        }

        for (var i = 0; i < sets.length; i++) {
            for(var key in loc[sets[i]])  {
                var setVal = this.g(sets[i] + Localization.KEY_SEP + key, {}, {});
                text = text.split('^loc_' + key + '^').join(loc[sets[i]][key]);
            }
        }

        // If the localization is for HTML output, load the localization into client side JS
        if (text.indexOf('<body') > -1)  {
            text = text.concat(pb.ClientJs.includeJS(pb.UrlService.createSystemUrl('api/localization/script?locale=' + this.language, hostname)));
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
     * @deprecated Since 0.5.0
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
        
        //create a key that can be converted over to what we need
        var convertedKey;
        if (!util.isNullOrUndefined(Localization.storage[key])) {
            convertedKey = key;
        }
        else {
            var topLevelKeys = Object.keys(Localization.storage);
            for (var i = 0; i < topLevelKeys.length; i++) {
                
                if (!util.isNullOrUndefined(Localization.storage[topLevelKeys[i]][key])) {
                    convertedKey = topLevelKeys[i] + Localization.KEY_SEP + key;
                    break;
                }
            }
            
            //just assign the key.  Won't find anything though.
            if (util.isNullOrUndefined(convertedKey)) {
                convertedKey = key;
            }
        }


        var val = this.g(convertedKey, {}, {});
        if (val !== null) {
            
            arguments[0] = val;
            val = util.format.apply(util, arguments);
        }
        return val;
    };
    
    Localization.prototype.g = function() {
        var key = arguments[0];
        var params = arguments[1] || {};
        var options = arguments[2] || { 
            site: pb.SiteService.GLOBAL_SITE,
        };
        
        //log operation
        if (pb.log.isSilly()) {
            pb.log.silly('Localization: Localizing key [%s] - Locale [%s]', key, this.language);
        }
        
        //error checking
        if (!util.isString(key)) {
            throw new Error('key parameter is required');
        }
        if (!util.isObject(params)) {
            throw new Error('params parameter is required');
        }
        if (!util.isObject(options)) {
            throw new Error('options parameter must be an object');
        }
        
        //TODO retrieve active plugins for site to narrow down which plugins should be examined during retrieval
        
        //get the current local as object
        var locale = this.localeObj;
        
        //get theme to prioritize 
        var plugin = options.plugin || this.activeTheme;
        
        //define convenience functions
        var self = this;
        var processValue = function(localization) {
            
            //set cache
            self.cache[key] = localization;
            
            //finish processing the value
            return localization.isParameterized ? 
                Localization.replaceParameters(localization.value, params, options.defaultParamVal) : 
                localization.value;
        };
        
        var processKeyBlock = function(keyBlock) {
            
            //check for plugin specific
            if (!util.isNullOrUndefined(keyBlock.__plugins)) {
                var pluginsBlock = keyBlock.__plugins
                
                //check for active plugin first
                if (!util.isNullOrUndefined(pluginsBlock[plugin])) {
                    
                    //we found a plugin specific value
                    return processValue(pluginsBlock[plugin]);
                }
                
                //check to see if the other plugins support the key
                var pluginsToInspect = Object.keys(pluginsBlock);
                for (var j = 0; j < pluginsToInspect.length; j++) {
                    
                    //skip the active plugin bc we've already checked it
                    if (plugin === pluginsToInspect[j]) {
                        continue;
                    }
                    
                    //examine the plugin
                    if (!util.isNullOrUndefined(pluginsBlock[pluginsToInspect[j]])) {
                    
                        //we found a country & plugin specific value
                        return processValue(pluginsBlock[pluginsToInspect[j]]);
                    }
                }
            }
            
            //no plugin specific key was found.  Now check the defaults
            if (!util.isNullOrUndefined(keyBlock.__default)) {
                return processValue(keyBlock.__default);
            }
            
            //counldn't find it in this block
            return null;
        };
        
        var processLanguageBlock = function(langBlock) {
            if (!util.isObject(langBlock)) {
                return null;
            }
            
            //check for country specific
            if (util.isString(locale.countryCode)) {

                var countryKey = k(locale.countryCode);
                if (!util.isNullOrUndefined(langBlock[countryKey])) {
                    
                    var countryResult = processKeyBlock(langBlock[countryKey]);
                    if (util.isString(countryResult)) {
                        return countryResult;
                    }
                }
            }

            //we failed to find the value in a country specific block.  We need to 
            //move on to the language
            var langResult = processKeyBlock(langBlock);
            if (util.isString(langResult)) {
                return langResult;
            }

            //we counldn't find it in this locale
            return null;
        };
        
        var finalize = function(result) {
            return util.isString(result) || options.defaultVal !== undefined ? result : key;
        };
        
        //verify that key even exists
        if (!Localization.keys[key]) {
            return finalize(options.defaultVal);
        }
        else if (this.cache[key]) {
            
            //we have already processed this key once for this instance
            return finalize(processValue(this.cache[key]));
        }
        
        //key create key path
        var keyBlock = Localization.storage;
        var parts = key.split(Localization.KEY_SEP);
        for (var i = 0; i < parts.length; i++) {
            if (util.isNullOrUndefined(keyBlock[parts[i]]) || !keyBlock[parts[i]].__isKey) {
                
                //the key doesn't exist. Time to bail out
                return finalize(options.defaultVal);
            }
            
            keyBlock = keyBlock[parts[i]];
        }

        //we found the key.  Now we need to dig around and figure out which 
        //value to pick
        var langKey = k(locale.language);
        var result = processLanguageBlock(keyBlock[langKey]);
        if (!util.isString(result)) {
            
            //check to see if we should fall back to the default locale
            var defaultLocale = Localization.parseLocaleStr(Localization.getDefaultLocale());
            if (defaultLocale.language !== this.localeObj.language || defaultLocale.countryCode !== this.localeObj.countryCode) {
                
                locale = defaultLocale;
                langKey = k(defaultLocale.language);
                result = processLanguageBlock(keyBlock[langKey]);
            }
            else {
                result = options.defaultVal;
            }
        }
        
        //finally, if we have a string result return it otherwise settle on the key
        return finalize(result);
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
        
        var locales;
        var loc = Localization.getDefaultLocale();
        if (request) {
            if (util.isString(request)) {
                locales = new Locale.Locales(request);
                loc = locales.best(Localization.supported);
            }
            else if (request.headers[Localization.ACCEPT_LANG_HEADER]){
                locales = new Locale.Locales(request.headers[Localization.ACCEPT_LANG_HEADER]);
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
     * @param {Function} cb
     */
    Localization.init = function(cb) {
        var supportedLocales = [];
        Localization.storage = {};
        Localization.keys = {};

        //create path to localization directory
        var options = {
            recursive: false,
            filter: function(filePath) { return filePath.indexOf(JS_EXT) === filePath.length - JS_EXT.length; }
        };
        var localizationDir = path.join(pb.config.docRoot, 'public', 'localization');
        util.getFiles(localizationDir, options, function(err, files) {
            if (util.isError(err)) {
                return cb(err);
            }
            
            var compoundedResult = true;
            files.forEach(function(file) {
                
                //parse the file
                var obj = null;
                try {
                    obj = require(file);
                }
                catch(e) {
                    pb.log.warn('Localization: Failed to load core localization file [%s]. %s', absolutePath, e.stack);
                    
                    //we failed so skip this file
                    return;
                }

                //convert file name to locale
                var localeObj = Localization.parseLocaleStr(file);
                
                //register the localization as defaults (call private method)
                compoundedResult &= Localization._registerLocale(localeObj, obj);
            });
            
            //set the supported locales
            pb.log.debug("Localization: Supporting - " + JSON.stringify(Object.keys(Localization.supportedLookup)));
            cb(null, compoundedResult);
        });
    };

    /**
     * Determines if there have been keys registered for the specified locale.  
     * An example locale string would be: en-US.  Where the characters to the 
     * left of the dash are the language code and the characters to the right 
     * of the dash represent the country code.
     * @static
     * @method isSupported
     * @param {String} locale
     * @return {Boolean}
     */
    Localization.isSupported = function(locale) {
        if (!locale) {
            return false;
        }
        
        //make sure the locale is properly formatted
        var localeObj = Localization.parseLocaleStr(locale);
        locale = Localization.formatLocale(localeObj.language, localeObj.countryCode);
        
        return Localization.supportedLookup[locale] ? true : false;
    };

    /**
     *
     * @static
     * @method getLocalizationPackage
     * @param {String} locale
     * @return {Object}
     */
    Localization.getLocalizationPackage = function(locale, options) {
        if (!pb.validation.isNonEmptyStr(locale, true)) {
            return null;
        }

        var ls = new Localization(locale);
        var package = {};
        var keys = Object.keys(Localization.keys);
        keys.forEach(function(key) {
            var result = ls.g(key, {}, options);
            
            var parts = key.split(Localization.KEY_SEP);
            if (parts.length === 1) {
                package[key] = result;
                return;
            }
            
            var block = package;
            for (var i = 0; i < parts.length; i++) {
                if (i == parts.length - 1) {
                    block[parts[i]] = result;
                    break;
                }
                else if (util.isNullOrUndefined(block[parts[i]])) {
                    block[parts[i]] = {};
                }
                block = block[parts[i]];
            }
        });
        return package;
    };

    /**
     * @deprecated since 0.5.0
     * @static
     * @method registerLocalizations
     * @param {String} locale
     * @param {Object} localizations
     * @return {Boolean}
     */
    Localization.registerLocalizations = function(locale, localizations, options) {
        pb.log.warn('Localization: Localization.registerLocalizations is deprecated. Use Localization.registerLocale');
        return Localization.registerLocale(locale, localizations, options);
    };
    
    /**
     *
     * @static
     * @method registerLocale
     * @param {String} locale
     * @param {Object} localizations
     * @return {Boolean}
     */
    Localization.registerLocale = function(locale, localizations, options) {
        if (!util.isObject(options)) {
            throw new Error('options parameter is required');
        }
        if (!util.isString(options.plugin)) {
            throw new Error('options.plugin is required');
        }
         
        return Localization._registerLocale(locale, localizations, options);
    };
                
    Localization._registerLocale = function(locale, localizations, options) {
        if (util.isString(locale)) {
            locale = Localization.parseLocaleStr(locale);
        }
        if (util.isObject(locale)) {
            if (!util.isString(locale.language)) {
                throw new Error('locale.language is required');
            }
        }
        else {
            throw new Error('locale parameter is required');
        }
        if (!util.isObject(localizations)) {
            throw new Error('localizations parameter is required');
        }
        if (!util.isObject(options)) {
            options = {};
        }
        
        //log it
        if (pb.log.isSilly()) {
            pb.log.silly('Localization: Registering locale [%s] for plugin [%s]', Localization.formatLocale(locale.language, locale.countryCode), options.plugin ? options.plugin : 'SYSTEM');
        }
        
        //load up top level keys into the queue
        var queue = [];
        var processObj = function(prefix, obj) {
            util.forEach(obj, function(val, key) {
                queue.push({
                    key: prefix ? prefix + Localization.KEY_SEP + key : key,
                    val: val
                });
            });
        };
        processObj(null, localizations);
        
        var compoundedResult = true;
        while(queue.length > 0) {
            var item = queue.shift();
            if (util.isObject(item.val)) {
                processObj(item.key, item.val);
            }
            else if (util.isString(item.val)){
                compoundedResult &= Localization._registerLocalization(locale, item.key, item.val, options);
            }
            else {
                compoundedResult = false;
                pb.log.warn('Localization: Locale [%s] key [%s] provided an invalid value: %s', Localization.formatLocale(locale.language, locale.countryCode), item.key, JSON.stringify(item.val));
            }
        }

        //ensure that we add the supported localization
        if (compoundedResult && !Localization.isSupported(locale)) {
            Localization.supportedLookup[Localization.formatLocale(locale.language, locale.countryCode)] = locale;
            Localization.supported = new Locale.Locales(Object.keys(Localization.supportedLookup));
        }
        return compoundedResult;
    };

    /**
     * @private
     * @static
     * @method _registerLocalization
     * @param {String} locale
     * @param {String} key
     * @param {String} value
     * @param {Object} options
     * @param {String} options.plugin
     * @return {Boolean}
     */
    Localization.registerLocalization = function(locale, key, value, options) {
        if (!util.isObject(options)) {
            throw new Error('options parameter is required');
        }
        if (!util.isString(options.plugin)) {
            throw new Error('options.plugin is required');
        }
        
        return Localization._registerLocalization(locale, key, value, options);
    };
    
    /**
     * @private
     * @static
     * @method _registerLocalization
     * @param {String} locale
     * @param {String} key
     * @param {String} value
     * @param {Object} [options]
     * @param {String} [options.plugin]
     * @return {Boolean}
     */
    Localization._registerLocalization = function(locale, key, value, options) {
        if (util.isString(locale)) {
            locale = Localization.parseLocaleStr(locale);
        }
        if (util.isObject(locale)) {
            if (!util.isString(locale.language)) {
                throw new Error('locale.language is required');
            }
        }
        else {
            throw new Error('locale is required');
        }
        if (!util.isString(key)) {
            throw new Error('key parameter is required');
        }
        if (!util.isString(value)) {
            throw new Error('value parameter is required');
        }
        
        //set defaults
        if (!util.isObject(options)) {
            options = {};
        }
        
        //parse the key
        var keyParts = key.split(Localization.KEY_SEP);
        
        //ensure that the key path exists and set a reference to the block that 
        //represents the key.  We are essentially walking the tree to get to 
        //the key.  When a child node does not exist we create it.
        var keyBlock = findKeyBlock(key);
        if (keyBlock === null) {
            return false;
        }
        
        //ensure that the language block exists
        var langKey = k(locale.language);
        if (util.isNullOrUndefined(keyBlock[langKey])) {
            keyBlock[langKey] = {};
        }
        var insertionBlock = keyBlock[langKey];
        
        //check to see if we need to move to a counry code block
        if (util.isString(locale.countryCode)) {
            
            var countryKey = k(locale.countryCode);
            if (util.isNullOrUndefined(insertionBlock[countryKey])) {
                insertionBlock[countryKey] = {};
            }
            insertionBlock = insertionBlock[countryKey];
        }
        
        //check to see if we are setting a default localization or a plugin specific one
        var valueBlock = {
            value: value,
            isParameterized: Localization.containsParameters(value)
        };
        if (util.isString(options.plugin)) {
            if (util.isNullOrUndefined(insertionBlock.__plugins)) {
                insertionBlock.__plugins = {};
            }
            insertionBlock.__plugins[options.plugin] = valueBlock;
        }
        else { //we are inserting a system default
            insertionBlock.__default = valueBlock;
        }
        
        //track the keys to know if they exist.  A performance boost in 
        //building localization packages, lookups, and removal from system.
        Localization.keys[key] = true;

        return true;
    };
    
    Localization.unregisterLocale = function(locale, options) {
        if (util.isString(locale)) {
            locale = Localization.parseLocaleStr(locale);
        }
        if (util.isObject(locale)) {
            if (!util.isString(locale.language)) {
                throw new Error('locale.language is required');
            }
        }
        else {
            throw new Error('locale is required');
        }
        
        //iterate over all of the keys
        var result = true;
        Object.keys(Localization.keys).forEach(function(key) {
            result &= Localization.unregisterLocalization(locale, key, options);
        });
        return result;
    };
    
    Localization.unregisterLocalization = function(locale, key, options) {
        if (util.isString(locale)) {
            locale = Localization.parseLocaleStr(locale);
        }
        if (util.isObject(locale)) {
            if (!util.isString(locale.language)) {
                throw new Error('locale.language is required');
            }
        }
        else {
            throw new Error('locale is required');
        }
        if (!util.isString(key)) {
            throw new Error('key parameter is required');
        }
        if (!util.isObject(options)) {
            options = {};
        }
        
        //ensure that the key even exists
        if (!util.isString(Localization.keys[key])) {
            return false;
        }
        
        //walk the tree looking for the key
        var keyBlock = findKeyBlock(key);
        if (keyBlock === null) {
            return false;
        }
        
        var langKey = k(locale.language);
        var langBlock = keyBlock[langKey];
        if (util.isNullOrUndefined(langBlock)) {
            
            //the language could not be found
            return false;
        }
        
        //check for country
        if (util.isString(locale.countryCode)) {
            
            var countryKey = k(locale.countryCode);
            if (!util.isNullOrUndefined(langBlock[countryKey])) {
                
                var countryBlock = langBlock[countryKey];//translate to plugin key
                if (util.isString(options.plugin)) {
                    
                    if (util.isString(countryBlock[options.plugin])) {
                        delete countryBlock[options.plugin];
                        return true;
                    }
                    
                    //we were asked to target the plugin only
                    return false;
                }
            }
            
            if (util.isString(keyBlock[countryKey].__default)) {
                delete keyBlock[countryKey].__default;
                return true;
            }
            return false;
        }
        
        //check the plugin at the lang level
        if (util.isString(options.plugin) && util.isObject(langBlock.__plugins)) {
                    
            if (util.isString(langBlock.__plugins[options.plugin])) {
                delete langBlock.__plugins[options.plugin];
                return true;
            }

            //we were asked to target the plugin only
            return false;
        }
        
        //finally check the default
        if (util.isString(langBlock.__default)) {
            delete langBlock.__default;
            return true;
        }
        return false;
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
    
    Localization.containsParameters = function(localizationValue) {
        if (!util.isString(localizationValue)) {
            throw new Error('localizationParameter is required');
        }
        return localizationValue.search(Localization.PARAM_REPLACEMENT_REGEX) >= 0;
    };
    
    Localization.replaceParameters = function(value, params, defaultVal) {
        if (!util.isString(value)) {
            throw new Error('value parameter is required');
        }
        if (!util.isObject(params)) {
            throw new Error('params parameter is required');
        }
        
        //We went with a homegrown solution here because it is ~4 times faster 
        //than the regex expression solution: 
        //http://stackoverflow.com/questions/1408289/how-can-i-do-string-interpolation-in-javascri
        var prev = null;
        var isOpen = false;
        var variable = '';
        var val = '';
        for (var i = 0; i < value.length; i++) {
            if (!isOpen && value[i] === '{' && prev !== '%') {
                isOpen = true;
            }
            else if (isOpen && value[i] === '}') {
                val += params[variable] || defaultVal || variable;
                isOpen = false;
                variable = '';
            }
            else if (isOpen) {
                variable += value[i];
            }
            else {
                val += value[i];
            }
            prev = value[i];
        }
        return val;
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

            var localization = new Localization(locale);

            var kv = {
                value: locale,
                name: localization.g('generic.LOCALE_DISPLAY', {}, {})
            };
            locales.push(kv);
        });
        return locales;
    };
    
    Localization.parseLocaleStr = function(filePath) {
        if (util.isObject(filePath)) {
            if (!util.isString(filePath.language)) {
                throw new Error('filePath.language parameter is required');
            }
            if (!util.isString(filePath.countryCode)) {
                throw new Error('filePath.countryCode parameter is required');
            }
            
            //we have a valid locale we can stop
            return filePath;
        }
        if (!util.isString(filePath)) {
            throw new Error('filePath parameter is required');
        }
        
        var lastSlashPos = filePath.lastIndexOf(path.sep);
        var extPos = filePath.lastIndexOf(JS_EXT);
        if (extPos < 0) {
            extPos = filePath.length;
        }
        var locale = filePath.substr(lastSlashPos + 1, extPos - lastSlashPos - 1);
        
        var parts = locale.split(Localization.LOCALE_PART_SEP);
        var lang = parts[0] ? parts[0].toLowerCase() : null;
        var countryCode = parts[1] ? parts[1].toUpperCase() : null;
        return {
            language: lang,
            countryCode: countryCode,
            toString: function() {
                return Localization.formatLocale(this.lang, this.countryCode);
            }
        };
    };
    
    Localization.formatLocale = function(language, countryCode) {
        if (!util.isString(language)) {
            throw new Error('language parameter is required');
        }
        
        var localeStr = language.toLowerCase();
        if (util.isString(countryCode)) {
            localeStr += Localization.LOCALE_PART_SEP + countryCode.toUpperCase();
        }
        return localeStr;
    };
    
    function k(key) {
        return '__' + key;
    }
    
    function findKeyBlock(key) {
        
        //parse the key
        var keyParts = key.split(Localization.KEY_SEP);
        
        //walk the tree looking for the storage structure
        var keyBlock = Localization.storage;
        keyParts.forEach(function(part) {
            if (util.isNullOrUndefined(keyBlock[part])) {
                keyBlock[part] = {
                    __isKey: true
                };
            }
            else if (!keyBlock[part].__isKey) {;
                
                //bad news bears. They tried to provide a key in a protected 
                //namespace.  Basically all the things with "__" prefixes
                return null;
            }
            keyBlock = keyBlock[part];
        });
        
        return keyBlock;
    }
    
    return Localization;
};
