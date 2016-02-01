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
    function Localization(){}
    util.inherits(Localization, pb.BaseAdminController);

    Localization.prototype.render = function(cb) {
        var self = this;

        this.getJSONPostParams(function(err, post) {
            if(util.isError(err)) {
                return cb({
                    code: 500,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('ERROR_SAVING'), err)
                });
            }

            if(pb.config.localization && pb.config.localization.db){
                return self.saveLocalesToDatabase(post, cb);
            }

            var filepath = path.join(pb.config.docRoot, 'plugins', post.plugin, 'public', 'localization', post.lang + '.json');
            fs.readFile(filepath, "utf-8", function (err, data) {
                if (err) throw err;
                console.log(data);
                var pluginsJsonFileObj;
                try{
                    pluginsJsonFileObj = JSON.parse(data);
                } catch(e) {
                    pluginsJsonFileObj = null;
                }
                if(pluginsJsonFileObj) {
                    var obj = {};
                    post.translations.forEach(function (element){
                        obj[element.key] = element.value;
                    });
                    pluginsJsonFileObj[post.siteName] = obj;
                    try{
                        pluginsJsonFileObj = JSON.stringify(pluginsJsonFileObj);
                    }catch(e){
                        console.log(e);
                        return cb({
                            code: 500,
                            content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('ERROR_SAVING'), e)
                        });
                    }

                    fs.writeFile(filepath, pluginsJsonFileObj, function (err) {
                        if (err) throw err;
                        console.log('It\'s saved!');
                        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS,'happy happy joy joy')});
                    });
                }
            });

        });

    };

    Localization.prototype.saveLocalesToDatabase = function(post, cb){
        var self = this;
        var col = "localizations";
        var queryService = new pb.SiteQueryService({site: self.site, onlyThisSite: true});

        var opts = {
            where: {_id: self.query.siteName}
        };

        queryService.q(col, opts, function (err, doc) {
            if(!doc[0])
                doc = {_id: post.siteName, storage: {}};
            else{
                doc= doc[0];
            }
            var objectHead = doc.storage;
            if (self.site) {
                doc.storage[self.site] = doc.storage[self.site] || {isSite: true, isKey: true};
                objectHead = doc.storage[self.site];
            }

            for (var i = 0; i < post.translations.length; i++) {
                var keysBody = formatDocument(post.translations[i], post);
                var key = post.translations[i].key;
                objectHead[key] = util.deepMerge(keysBody, doc.storage[self.site][key]);
            }

            var siteDocument = pb.DocumentCreator.create(col, doc);


            queryService.save(siteDocument, function (err, result) {
                if (util.isError(err)) {
                    pb.log.error(err);
                    return cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('ERROR_SAVING'), result)
                    });
                }

                return cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.get('SAVED'))});
            });
        });
    };

    function formatDocument(element, data){

        var locale = splitLocale(data.lang);
        var isKeyText = "__isKey";
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

    Localization.prototype.getLocales = function (cb) {
        var self = this;

        if (!self.query.siteName || !self.query.plugin || !self.query.lang) {
            return cb({
                code: 500,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'no siteName passed in')
            });
        }

        if (pb.config.localization && pb.config.localization.db) {
            self.getLocalesFromDB(cb);
        }
        else{
            var filepath = path.join(pb.config.docRoot, 'plugins', self.query.plugin, 'public', 'localization', self.query.lang + '.json');
            fs.readFile(filepath, "utf-8", function (err, data) {
                if (err) throw err;

                if (data) {
                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, JSON.parse(data))});
                }
            });
        }
    };

    Localization.prototype.getLocalesFromDB = function(cb){
        var self = this;
        var col = "localizations";
        var opts = {
            where: {_id: self.query.siteName}
        };
        var queryService = new pb.SiteQueryService({site: self.site, onlyThisSite: true});

        queryService.q(col, opts, function (err, result) {
            if (util.isError(err)) {
                pb.log.error(err);
                return cb({
                    code: 500,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('ERROR_SAVING'), result)
                });
            }
            var displayObj = convertLocalesToDisplayObject(self.query.lang, self.query.plugin, result[0]);
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, displayObj)});
        });
    };

    function convertLocalesToDisplayObject(lang, selectedPlugin, data){
        if(!data || !data.storage){
            data = { storage: {}};
        }
        var siteLocs = data.storage[data.site] || {};
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
                if(keyObj[localeObj.language][localeObj.country].__plugins)
                    if(keyObj[localeObj.language][localeObj.country].__plugins[selectedPlugin])
                        return keyObj[localeObj.language][localeObj.country].__plugins[selectedPlugin].value;
            }
        }
        return '';
    }
    function splitLocale(lang){
        var locale = {country:'', language:''};
        var langObj = lang.split('-');
        if(langObj.length != 2){
            return new Error('lang couldnt be split into locale');
        }
        locale.language = "__" + langObj[0];
        locale.country = "__" + langObj[1];
        return locale;
    }


    //exports
    return Localization;
};
