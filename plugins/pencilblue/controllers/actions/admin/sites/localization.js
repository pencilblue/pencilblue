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
            var message = null;
            if(message) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
                });
                return;
            }
            if(util.isError(err)) {
                cb({
                    code: 500,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.get('ERROR_SAVING'), err)
                });
                return;
            }
            var filepath = path.join(pb.config.docRoot, 'plugins', post.plugin, 'public', 'localization', post.lang);
            fs.readFile(filepath, "utf-8", function (err, data) {
                if (err) throw err;
                console.log(data);
                var x;
                try{
                    x = JSON.parse(data);
                } catch(e) {
                    x = null;
                }
                if(x) {
                    var obj = {};
                    obj[post.redirectFrom] = post.redirectTo;
                    var c = x;
                    x[post.siteName] = obj;
                    try{
                        x = JSON.stringify(x);
                    }catch(e){
                        x = c;
                    }

                    fs.writeFile(filepath, x, function (err) {
                        if (err) throw err;
                        console.log('It\'s saved!');
                        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS,'happy happy joy joy')});
                    });
                }
            });

        });

    };

    //exports
    return Localization;
};
