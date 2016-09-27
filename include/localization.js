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
     * @param {Request|string} request The request object
     * @param {Object} [options]
     * @param {String} [options.activeTheme]
     * @param {Array} [options.supported] The languages that the localization
     * instance should be limited to.
     */
    function Localization(request, options){
        if (!util.isObject(options)) {
            options = {};
        }

        /**
         * expected to be lowercase and of the form "en-us"
         * @property language Really should be renamed to locale in the future
         * @type {String}
         */
        this.language = Localization.best(request, options.supported).toString();

        /**
         * @property localeObj
         * @type {Object}
         */
        this.localeObj = Localization.parseLocaleStr(this.language);

        /**
         * Stores the keys already retrieved for the instance to prevent duplicate retrieval.
         * @property cache
         * @type {Object}
         */
        this.cache = {};

        /**
         * The currently active theme that should be prioritized when
         * performing key lookup
         * @property activeTheme
         * @type {string}
         */
        this.activeTheme = options.activeTheme;
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
     * @property PARAM_REPLACEMENT_REGEX
     * @type {RegExp}
     */
    Localization.PARAM_REPLACEMENT_REGEX = /{([^{}]*)}/g;

    /**
     * Localizes a string by searching for keys within the template and replacing
     * them with the specified values.
     * @deprecated
     * @method localize
     * @param {Array} sets The localizations sets to search in
     * @param {string} text The text to localize
     * @param {string} hostname The current hostname
     * @return {string} The text where keys have been replaced with translated values
     */
    Localization.prototype.localize = function(sets, text, hostname){
        if (pb.log.isSilly()) {
            pb.log.silly('Localization: Localizing text - Locale [%s] Sets %s', this.language, JSON.stringify(sets));
        }
        pb.log.warn('Localization: localize is deprecated and will be removed in 1.0. Place your localizations in templates');

        //get i18n from storage
        var loc = Localization.storage;
        if (util.isNullOrUndefined(loc)) {
            throw new Error("Failed to set a language. LANG="+util.inspect(this.language));
        }

        //to squeeze a little performance out of an outdated function we convert the sets to a quick lookup to reduce
        // the number of comparisons necessary to see if we should even check for a localization
        var self = this;
        var superSets = ['generic'];
        util.arrayPushAll(sets, superSets);
        var setLookup = superSets.reduce(function(lookup, prefix) {
            lookup[prefix] = true;
            return lookup;
        }, {});

        text = Object.keys(Localization.storage).reduce(function(content, key) {

            //look to see if the set even matches
            var pieces = key.split('.');

            //see if the set matches only when the set is in the lookup and when the key is nested (backward compatibility piece)
            if (pieces.length === 1 || !setLookup[pieces[0]]) {
                return content;
            }

            var setVal = self.g(key/*, {empty options}*/);
            return content.split('^loc_' + pieces[1] + '^').join(setVal);
        }, text);

        // If the localization is for HTML output, load the localization into client side JS
        if (text.indexOf('<body') >= 0)  {
            text = text.concat(pb.ClientJs.includeJS(pb.UrlService.createSystemUrl('api/localization/script?locale=' + this.language, { hostname: hostname })));
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
     * supported formatting.
     * @deprecated Since 0.5.0
     * @method get
     * @param {String} key
     * @param {String|Integer|Number|Object} [args] The variable number of
     * parameters to be injected into the localization value
     * @return {string|null} The formatted and localized string
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
        var convertedKey = key;
        if (util.isNullOrUndefined(Localization.storage[key])) {

            //now we must loop over the keys to see if we were given only the second half of a localization key
            //this is extremely inefficient and hence why the function is deprecated
            var keys = Object.keys(Localization.storage);
            for (var i = 0; i < keys.length; i++) {

                //check to see if the the key is partitioned
                var index = keys[i].indexOf('.');
                if (index < 0) {
                    continue;
                }

                //now we check to see if we were only given the second half of the localization key
                if (keys[i].substr(index + 1) === key) {
                    convertedKey = keys[i];

                    pb.log.debug('Localization: Using the localization key %s is non-performant and should be updated to %s', key, convertedKey);
                    break;
                }
            }

            //just assign the key.  Won't find anything though.
            if (util.isNullOrUndefined(convertedKey)) {
                convertedKey = key;
            }
        }


        var val = this.g(convertedKey/*, {empty options}*/);
        if (val !== null) {

            arguments[0] = val;
            val = util.format.apply(util, arguments);
        }
        return val;
    };

    /**
     *
     * @method g
     * @param {String} key
     * @param {Object} [options]
     * @param {String} [options.site=global]
     * @param {Object} [options.params={}]
     * @param {Object} [options.plugin]
     * @return {String}
     */
    Localization.prototype.g = function(key, options) {
        options = options || {
            site: pb.SiteService.GLOBAL_SITE,
            params: {}
        };

        //log operation
        if (pb.log.isSilly()) {
            pb.log.silly('Localization: Localizing key [%s] - Locale [%s]', key, this.language);
        }

        //error checking
        if (!util.isString(key)) {
            throw new Error('key parameter is required');
        }
        if (!util.isObject(options)) {
            throw new Error('options parameter must be an object');
        }

        var params = options.params || {};
        if (!util.isObject(params)) {
            throw new Error('params parameter is required');
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
                var pluginsBlock = keyBlock.__plugins;

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

            //couldn't find it in this block
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

            //we couldn't find it in this locale
            return null;
        };

        var finalize = function(result) {
            return util.isString(result) || options.defaultVal !== undefined ? result : key;
        };

        //verify that key even exists, if not we're done.  Just send back the default val, if provided
        if (!Localization.storage[key]) {
            return finalize(options.defaultVal);
        }
        else if (this.cache[key]) {

            //we have already processed this key once for this instance
            return finalize(processValue(this.cache[key]));
        }

        //key create key path
        var keyBlock = findKeyBlock(key, false);
        if (!keyBlock) {
            return null;
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
     * @param {Request|String} request The request object
     * @param {Array} [supported] The array of supported locales
     * @return {string} Locale for the request
     */
    Localization.best = function(request, supported){
        supported = util.isArray(supported) ?
            new Locale.Locales(supported) : Localization.supported;

        var locales;
        var loc = Localization.getDefaultLocale();
        if (request) {
            var acceptLangStr = util.isString(request) ? request :
                (request.headers[Localization.ACCEPT_LANG_HEADER] || loc);
            locales = new Locale.Locales(acceptLangStr);
            loc = locales.best(supported);
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
        Localization.storage = {};

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
                    pb.log.warn('Localization: Failed to load core localization file [%s]. %s', file, e.stack);

                    //we failed so skip this file
                    return;
                }

                //convert file name to locale
                var localeObj = Localization.parseLocaleStr(file);

                //register the localization as defaults (call private method)
                compoundedResult = compoundedResult && Localization._registerLocale(localeObj, obj);
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
        if (!util.isString(locale) || locale.length === 0) {
            return false;
        }

        //make sure the locale is properly formatted
        var localeObj = Localization.parseLocaleStr(locale);
        locale = Localization.formatLocale(localeObj.language, localeObj.countryCode);

        return !!Localization.supportedLookup[locale];
    };

    /**
     * Retrieves the localization package for the specified locale
     * @static
     * @method getLocalizationPackage
     * @param {String} locale
     * @param {Object} [options] See options for Localization.g
     * @return {Object}
     */
    Localization.getLocalizationPackage = function(locale, options) {
        if (!pb.validation.isNonEmptyStr(locale, true)) {
            return null;
        }

        var ls = new Localization(locale);
        var packageObj = {};
        Object.keys(Localization.storage).forEach(function(key) {
            var result = ls.g(key, options);

            var parts = key.split(Localization.KEY_SEP);
            if (parts.length === 1) {
                packageObj[key] = result;
                return;
            }

            var block = packageObj;
            for (var i = 0; i < parts.length; i++) {
                if (i === parts.length - 1) {
                    block[parts[i]] = result;
                    break;
                }
                else if (util.isNullOrUndefined(block[parts[i]])) {
                    block[parts[i]] = {};
                }
                block = block[parts[i]];
            }
        });
        return packageObj;
    };

    /**
     * @deprecated since 0.5.0
     * @static
     * @method registerLocalizations
     * @param {String} locale
     * @param {Object} localizations
     * @param {object} options
     * @param {string} [options.plugin]
     * @return {Boolean}
     */
    Localization.registerLocalizations = function(locale, localizations, options) {
        pb.log.warn('Localization: Localization.registerLocalizations is deprecated. Use Localization.registerLocale');
        return Localization.registerLocale(locale, localizations, options);
    };

    /**
     * Registers a localization package for the provided locale and plugin.
     * @private
     * @static
     * @method _registerLocale
     * @param {String|Object} locale
     * @param {Object} localizations
     * @param {Object} [options]
     * @param {String} [options.plugin]
     * @return {Boolean}
     */
    Localization.registerLocale = function(locale, localizations, options) {
        assertOptions(options);

        return Localization._registerLocale(locale, localizations, options);
    };

    /**
     * Registers a localization package for the provided locale.  Optionally,
     * the packaged can be scoped to a specific plugin.
     * @private
     * @static
     * @method _registerLocale
     * @param {String|Object} locale
     * @param {string} [locale.language] Only required when passing locale as an object
     * @param {string} [locale.countryCode]
     * @param {Object} localizations
     * @param {Object} [options]
     * @param {string} [options.plugin=SYSTEM]
     * @return {Boolean}
     */
    Localization._registerLocale = function(locale, localizations, options) {
        locale = parseLocale(locale);

        if (!util.isObject(localizations)) {
            throw new Error('localizations parameter is required');
        }
        if (!util.isObject(options)) {
            options = {};
        }

        //log it
        if (pb.log.isSilly()) {
            pb.log.silly('Localization: Registering locale [%s] for plugin [%s]', Localization.formatLocale(locale.language, locale.countryCode), options.plugin || 'SYSTEM');
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
                compoundedResult = compoundedResult && Localization._registerLocalization(locale, item.key, item.val, options);
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
     * Registers a single localization key for the provided locale and plugin.
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
        assertOptions(options);

        return Localization._registerLocalization(locale, key, value, options);
    };

    /**
     * Registers a single localization key for the provided locale.  Optionally, the localization can be scoped to a single plugin.
     * @private
     * @static
     * @method _registerLocalization
     * @param {String|object} locale
     * @param {string} [locale.language] Only required when passing locale as an object
     * @param {string} [locale.countryCode]
     * @param {String} key
     * @param {String} value
     * @param {Object} [options]
     * @param {String} [options.plugin]
     * @return {Boolean}
     */
    Localization._registerLocalization = function(locale, key, value, options) {
        locale = parseLocale(locale);
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

        //ensure that the key path exists and set a reference to the block that
        //represents the key.  We are essentially walking the tree to get to
        //the key.  When a child node does not exist we create it.
        var keyBlock = findKeyBlock(key, true);

        //ensure that the language block exists
        var langKey = k(locale.language);
        if (util.isNullOrUndefined(keyBlock[langKey])) {
            keyBlock[langKey] = {};
        }
        var insertionBlock = keyBlock[langKey];

        //check to see if we need to move to a country code block
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

        return true;
    };

    /**
     * Removes a locale and all keys associated with it.  Optionally, the
     * operation can be scoped to a single plugin.
     * @static
     * @method unregisterLocale
     * @param {String|Object} locale
     * @param {string} [locale.language] Only required when locale is passed as an object
     * @param {string} [locale.countryCode]
     * @param {Object} [options]
     * @param {String} [options.plugin]
     * @return {Boolean}
     */
    Localization.unregisterLocale = function(locale, options) {
        locale = parseLocale(locale);

        //iterate over all of the keys
        var keysRemoved = Object.keys(Localization.storage).reduce(function(prev, key) {
            return prev + Localization.unregisterLocalization(locale, key, options);
        }, 0);

        //remove from quick lookup
        delete Localization.supportedLookup[Localization.formatLocale(locale.language, locale.countryCode)];
        Localization.supported = new Locale.Locales(Object.keys(Localization.supportedLookup));
        return keysRemoved > 0;
    };

    /**
     * Unregisters a single key for the given locale.  The locale can be just
     * the language or the combination of the language and country code.
     * Additionally, the operation can be scoped to a single plugin.
     * @static
     * @method unregisterLocalization
     * @param {String|Object} locale
     * @param {string} [locale.language] Only required when passing locale as an object
     * @param {string} [locale.countryCode]
     * @param {String} key
     * @param {Object} [options]
     * @param {String} [options.plugin]
     * @return {Boolean}
     */
    Localization.unregisterLocalization = function(locale, key, options) {
        locale = parseLocale(locale);

        if (!util.isString(key)) {
            throw new Error('key parameter is required');
        }
        if (!util.isObject(options)) {
            options = {};
        }

        //ensure that the key even exists
        if (!Localization.storage[key]) {
            return false;
        }

        //walk the tree looking for the key
        var keyBlock = findKeyBlock(key, false);
        if (!keyBlock) {
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

            //the lang block contains a key for the country code
            var countryKey = k(locale.countryCode);
            if (!util.isNullOrUndefined(langBlock[countryKey])) {

                // look to see if a plugin was specified
                var countryBlock = langBlock[countryKey];//translate to plugin key
                if (util.isString(options.plugin)) {

                    //the plugin was specified so we should check the country code block for a sub-section for the plugin
                    if (util.isString(countryBlock[options.plugin])) {
                        delete countryBlock[options.plugin];
                        return true;
                    }

                    //we were asked to target the plugin only
                    return false;
                }
            }

            //no plugin so we should fall through to the default block
            if (util.isObject(langBlock[countryKey].__default)) {
                delete langBlock[countryKey].__default;
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

    /**
     * Determines if a raw localization value contains named parameters
     * @static
     * @method containsParameters
     * @param {String} localizationValue
     * @return {Boolean}
     */
    Localization.containsParameters = function(localizationValue) {
        if (!util.isString(localizationValue)) {
            throw new Error('localizationParameter is required');
        }
        return localizationValue.search(Localization.PARAM_REPLACEMENT_REGEX) >= 0;
    };

    /**
     * Given a raw localization value and a set of parameters the function will
     * attempt to replace the named parameters in the raw value with the values
     * provided in the params.  When a named parameter is found that was not
     * provided a value the defaultVal parameter value is used.
     * @static
     * @method replaceParameters
     * @param {String} value
     * @param {Object} params
     * @param {String} [defaultVal]
     * @return {String}
     */
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

        var supported = Localization.getSupported();
        return supported.map(function(locale) {

            var localization = new Localization(locale);
            return {
                value: locale,
                name: localization.g('generic.LOCALE_DISPLAY'/*, {empty options}*/)
            };
        });
    };

    /**
     * Parses a locale or file path to a locale file and extracts the language
     * and country code into an object.
     * @static
     * @method parseLocaleStr
     * @param {String|object} filePath
     * @param {string} [filePath.language] Only required when passing filePath as an object
     * @param {string} [filePath.countryCode] Only required when passing filePath as an object
     * @return {Object}
     */
    Localization.parseLocaleStr = function(filePath) {
        if (util.isObject(filePath)) {
            if (!util.isString(filePath.language)) {
                throw new Error('filePath.language parameter is required');
            }
            if (!util.isNullOrUndefined(filePath.countryCode) && !util.isString(filePath.countryCode)) {
                throw new Error('filePath.countryCode parameter must be a string');
            }

            //we have a valid locale we can stop
            return filePath;
        }
        if (!util.isString(filePath)) {
            throw new Error('filePath parameter is required');
        }

        //detect what file path separator we are using. Unix first then windows
        var lastSlashPos = filePath.lastIndexOf('/');
        if (lastSlashPos < 0) {
            lastSlashPos = filePath.lastIndexOf('\\');
        }
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
            countryCode: countryCode
        };
    };

    /**
     * Formats a language and an optional country code into a proper locale
     * format (lang-COUNTRY)
     * @static
     * @method formatLocale
     * @param {String} language
     * @param {String} [countryCode]
     * @return {String}
     */
    Localization.formatLocale = function(language, countryCode) {
        if (!util.isString(language)) {
            throw new Error('language parameter is required');
        }
        if (!util.isNullOrUndefined(countryCode) && !util.isString(countryCode)) {
            throw new Error('countryCode parameter must be a string');
        }

        var localeStr = language.toLowerCase();
        if (util.isString(countryCode)) {
            localeStr += Localization.LOCALE_PART_SEP + countryCode.toUpperCase();
        }
        return localeStr;
    };

    /**
     * Asserts that the options parameter is provided and that it contains a
     * property "plugin" that is a string.
     * @private
     * @static
     * @method assertOptions
     * @param {Object} options
     * @param {String} options.plugin
     */
    function assertOptions(options) {
        if (!util.isObject(options)) {
            throw new Error('options parameter is required');
        }
        if (!util.isString(options.plugin)) {
            throw new Error('options.plugin is required');
        }
    }

    /**
     * Takes a locale object or string representation.  When a string it is
     * parsed to an object.  When an object is passed it is verified.  The
     * function throws an error when it finds invalid format.
     * @private
     * @static
     * @method parseLocale
     * @param {String|Object} locale
     * @param {string} [locale.language] Only required when passing an object
     * @return {Object}
     */
    function parseLocale(locale) {
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
        return locale;
    }

    /**
     * Formats a given key to be formatted as a "private" property in the
     * storage structure.  This is to prevent collisions between localization
     * keys.
     * @private
     * @static
     * @method k
     * @param {String} key
     * @return {String}
     */
    function k(key) {
        return '__' + key;
    }

    /**
     * Navigates the storage structure to find where a localization key's
     * values live
     * @private
     * @static
     * @method findKeyBlock
     * @param {String} key
     * @param {boolean} create
     * @return {Object} The object that contains the values for the key
     */
    function findKeyBlock(key, create) {
        if (create && typeof Localization.storage[key] === 'undefined') {
            Localization.storage[key] = {};
        }
        return Localization.storage[key];
    }

    return Localization;
};
