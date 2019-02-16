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

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Saves the site's Localization settings
     */
    function Localization(context) {
        if (!util.isObject(context)) {
            context = {};
        }

        context.type = "localizations";
        Localization.super_.call(this, context);
        this.dao = new pb.DAO();
    }

    util.inherits(Localization, pb.BaseObjectService);


    Localization.prototype.saveLocales = function (post, cb) {
        var self = this;
        var col = "localizations";
        var opts = {
            where: {_id: post.site}
        };
        this.getSingle(opts, function (err, doc) {
            if (!doc || !doc.storage) {
                doc = {_id: post.site, storage: {}};
            }
            doc = removeAllLocalesFromDoc(post, doc);
            var objectHead = doc.storage;
            if (post.site) {
                doc.storage[post.site] = doc.storage[post.site] || {isSite: true, isKey: true};
                objectHead = doc.storage[post.site];
            }

            for (var i = 0; i < post.translations.length; i++) {
                var keysBody = formatDocument(post.translations[i], post);
                var key = post.translations[i].key;
                objectHead[key] = util.deepMerge(keysBody, doc.storage[post.site][key]);
            }

            var siteDocument = pb.DocumentCreator.create(col, doc);


            self.dao.save(siteDocument, function (err, result) {
                if (util.isError(err)) {
                    pb.log.error('PENCILBLUE', err);
                    return cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'ERROR_SAVING', result)
                    });
                }
                var localizationService = new pb.LocalizationService();
                var jobId = localizationService.updateLocales(post.site);
                var content = pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, '', jobId);
                cb({content: content});
            });
        });
    };

    Localization.prototype.getLocales = function (post, cb) {
        var opts = {
            where: {_id: post.site}
        };
        this.getSingle(opts, function (err, result) {
            if (util.isError(err)) {
                pb.log.error('PENCILBLUE', err);
                return cb(pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'ERROR_SAVING', result));
            }
            var displayObj = convertLocalesToDisplayObject(post.lang, post.plugin, post.site, result);
            cb(null, displayObj);
        });
    };
    /**
     * Converts a single locale key value pair from the admin panel into a single
     * document for the database/locale storage object
     *
     * @param element, the key value object to be used in creation of the document
     * @param data, the whole data object from the post, used to get the affected locale and plugin
     * @returns document, a formatted document ready to be added to the sites storage object in the db
     */
    function formatDocument(element, data) {

        var locale = splitLocale(data.lang);
        var pluginText = "__plugins";
        var document = {};
        document.__isKey = true;

        document[locale.language] = {};
        document[locale.language][locale.country] = {};
        document[locale.language][locale.country].__plugins = {};
        document[locale.language][locale.country][pluginText] = {};
        document[locale.language][locale.country][pluginText][data.plugin] = {
            isParameterized: false,
            value: element.value
        };

        return document;

    }

    /**
     * Takes in a post body, and the localization document from the database, with these it will see if
     * any of the keys in the document have the language, country, and plugin that are on the post body
     * if it does, it will delete these values.  This is to allow for them to be rebuilt, thus allowing
     * us to "delete" keys that were previously in use.
     *
     * It also cleans up the object structure to prevent orphaned branches in the document.  Keys that never
     * resolve to a value
     * @param post, the post body with siteId and the language/country that are being edited along with the plugin
     * @param doc, the localization document from the database
     * @returns a modified document that has had all occurrences of the affected language/country/plugin values removed
     */
    function removeAllLocalesFromDoc(post, doc) {
        if(!doc.storage[post.site]){
            return doc;
        }

        var locale = splitLocale(post.lang);

        var keySet = Object.keys(doc.storage[post.site]);
        keySet = keySet.slice(2); // Remove isKey and isSite (will need to adapt when we remove isKey from the site level object)
        for (var i = 0; i < keySet.length; i++) {
            if (doc.storage[post.site][keySet[i]][locale.language] && doc.storage[post.site][keySet[i]][locale.language][locale.country]
                && doc.storage[post.site][keySet[i]][locale.language][locale.country].__plugins[post.plugin]) {

                delete doc.storage[post.site][keySet[i]][locale.language][locale.country].__plugins[post.plugin];
                if (Object.getOwnPropertyNames(doc.storage[post.site][keySet[i]][locale.language][locale.country].__plugins).length === 0) {
                    delete doc.storage[post.site][keySet[i]][locale.language][locale.country].__plugins;
                }
                if (Object.getOwnPropertyNames(doc.storage[post.site][keySet[i]][locale.language][locale.country]).length === 0) {
                    delete doc.storage[post.site][keySet[i]][locale.language][locale.country];
                }
                if (Object.getOwnPropertyNames(doc.storage[post.site][keySet[i]][locale.language]).length === 0) {
                    delete doc.storage[post.site][keySet[i]][locale.language];
                }
                if (Object.getOwnPropertyNames(doc.storage[post.site][keySet[i]]).length <= 1) { // It will always have the isKey property, if it has more than 1 property that means it has children
                    delete doc.storage[post.site][keySet[i]];
                }
            }
        }
        return doc;
    }

    /**
     * Does the inverse of the FormatDocument function.  Will take an item from the DB and
     * convert it into a flatter structure that the admin panel will be able to use
     *
     * @param lang
     * @param selectedPlugin
     * @param site
     * @param data
     * @returns an array of key value objects for use on the admin panel
     */
    function convertLocalesToDisplayObject(lang, selectedPlugin, site, data) {
        if (!data || !data.storage) {
            data = {storage: {}};
        }
        var siteLocs = data.storage[site] || {};
        var localeObj = splitLocale(lang);
        var displayObj = {};

        displayObj.site = buildKVObject(siteLocs, localeObj, selectedPlugin);
        displayObj.generic = buildKVObject(pb.Localization.storage, localeObj, selectedPlugin);

        return displayObj;
    }

    function buildKVObject(data, localeObj, selectedPlugin) {
        var kvList = {};
        var keyList = Object.keys(data);
        for (var i = 0; i < keyList.length; i++) {
            if (!data[keyList[i]].isSite) {
                var value = checkKeyObject(data[keyList[i]], localeObj, selectedPlugin);
                if (value) {
                    kvList[keyList[i]] = value;
                }
            }
        }
        return kvList;
    }

    function checkKeyObject(keyObj, localeObj, selectedPlugin) {
        if (keyObj[localeObj.language]) {
            if (keyObj[localeObj.language][localeObj.country]) {
                if (keyObj[localeObj.language][localeObj.country].__plugins) {
                    if (keyObj[localeObj.language][localeObj.country].__plugins[selectedPlugin]) {
                        return keyObj[localeObj.language][localeObj.country].__plugins[selectedPlugin].value;
                    }
                }
            }
        }
        return '';
    }

    function splitLocale(lang) {
        var locale = {country: '', language: ''};
        var langObj = lang.split('-');
        if (langObj.length !== 2) {
            pb.log.error('PENCILBLUE', 'Param lang: ' + lang + ' could not be split into a locale object!');
            return locale;
        }
        locale.language = "__" + langObj[0];
        locale.country = "__" + langObj[1];
        return locale;
    }

    //exports
    return Localization;
};
