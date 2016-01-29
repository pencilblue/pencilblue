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

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Saves the site's Localization settings
     */
    function Localization() {
    }

    util.inherits(Localization, pb.BaseAdminController);

    Localization.prototype.render = function (cb) {
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
