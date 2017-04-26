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

    function Localization(){}

    Localization.prototype.saveLocales = function(post, cb){
        var self = this;

        self.getLocales(post, function(err, pluginsJsonFileObj) {
            if (err) {
                throw err;
            }
            if (pluginsJsonFileObj) {
                var obj = {};
                post.translations.forEach(function (element) {
                    obj[element.key] = element.value;
                });
                pluginsJsonFileObj[post.site] = obj;
                try {
                    pluginsJsonFileObj = JSON.stringify(pluginsJsonFileObj);
                } catch (e) {
                    pb.log.error('PENCILBLUE', e);
                    return cb({
                        code: 500,
                        content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('ERROR_SAVING'), e)
                    });
                }
                sendLocalesToFile(post, pluginsJsonFileObj, cb);
            }
        });
    };

    Localization.prototype.getLocales = function(params, cb){
        var filepath = path.join(pb.config.docRoot, 'plugins', params.plugin, 'public', 'localization', params.lang + '.json');
        fs.readFile(filepath, "utf-8", function (err, data) {
            if (err)
            {
                if(err.toString().indexOf("no such file or directory") !== -1) {
                    return cb(null, {});
                }
                return cb(err);
            }

            if (data) {
                try {
                    cb(null, JSON.parse(data));
                } catch (e) {
                    cb(e);
                }
            }
        });
    };

    function sendLocalesToFile(post, locales, cb){
        var filepath = path.join(pb.config.docRoot, 'plugins', post.plugin, 'public', 'localization', post.lang + '.json');
        fs.writeFile(filepath, locales, function (err) {
            if (err) {
                throw err;
            }
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, 'Locales were saved successfully')});
        });
    }


    //exports
    return Localization;
};
