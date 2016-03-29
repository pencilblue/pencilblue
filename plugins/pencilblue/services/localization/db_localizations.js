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

var path = require('path');
var fs = require('fs');

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Saves the site's Localization settings
     */
    function Localization(context){
        if (!util.isObject(context)) {
            context = {};
        }

        context.type = "localizations";
        Localization.super_.call(this, context);
        this.dao = new pb.DAO();
    }
    util.inherits(Localization, pb.BaseObjectService);

    Localization.prototype.saveLocales = function(post, cb){
        var self = this;
        var col = "localizations";
        var opts = {
            where: {_id:post.site}
        };
        this.getSingle(opts, function (err, doc) {
            if(!doc || !doc.storage) {
                doc = {_id: post.site, storage: {}};
            }

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
                    pb.log.error(err);
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

    Localization.prototype.getLocales = function(post, cb){
        var opts = {
            where: {_id:post.site}
        };
        this.getSingle(opts, function (err, result) {
            if (util.isError(err)) {
                pb.log.error(err);
                return cb(pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'ERROR_SAVING', result));
            }
            var displayObj = convertLocalesToDisplayObject(post.lang, post.plugin, post.site, result);
            cb(null, displayObj);
        });
    };

    function formatDocument(element, data){

        var locale = splitLocale(data.lang);
        var pluginText = "__plugins";
        var document = {};
        document.__isKey = true;

        document[locale.language] = {};
        document[locale.language].__isKey = true;
        document[locale.language][locale.country] = {};
        document[locale.language][locale.country].__isKey = true;
        document[locale.language][locale.country].__plugins = {};
        document[locale.language][locale.country][pluginText] = {};
        document[locale.language][locale.country][pluginText][data.plugin] = {
            isParameterized:false,
            value: element.value
        };

        return document;

    }

    function convertLocalesToDisplayObject(lang, selectedPlugin, site, data){
        if(!data || !data.storage){
            data = { storage: {}};
        }
        var siteLocs = data.storage[site] || {};
        var localeObj = splitLocale(lang);
        var displayObj = {};

        displayObj.site = buildKVObject(siteLocs, localeObj, selectedPlugin);
        displayObj.generic = buildKVObject(data.storage, localeObj, selectedPlugin);

        return displayObj;
    }

    function buildKVObject(data, localeObj, selectedPlugin){
        var kvList = {};
        var keyList = Object.keys(data);
        for(var i = 0; i < keyList.length; i++){
            if(!data[keyList[i]].isSite){
                var value = checkKeyObject(data[keyList[i]], localeObj, selectedPlugin);
                if(value){
                    kvList[keyList[i]]=value;
                }
            }
        }
        return kvList;
    }
    function checkKeyObject(keyObj,localeObj,selectedPlugin){
        if(keyObj[localeObj.language]){
            if(keyObj[localeObj.language][localeObj.country]){
                if(keyObj[localeObj.language][localeObj.country].__plugins) {
                    if (keyObj[localeObj.language][localeObj.country].__plugins[selectedPlugin]) {
                        return keyObj[localeObj.language][localeObj.country].__plugins[selectedPlugin].value;
                    }
                }
            }
        }
        return '';
    }

    function splitLocale(lang){
        var locale = {country:'', language:''};
        var langObj = lang.split('-');
        if(langObj.length !== 2){
            return new Error('lang couldnt be split into locale');
        }
        locale.language = "__" + langObj[0];
        locale.country = "__" + langObj[1];
        return locale;
    }

    //exports
    return Localization;
};
