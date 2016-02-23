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

module.exports = function LocalizationApiControllerModule(pb) {

    //pb dependencies
    var util = pb.util;
    var dbLocalizationService = require("../../services/localization/db_localizations.js");
    var siteLocalizationService = require("../../services/localization/file_localizations.js");

    /**
     *
     * @class LocalizationApiController
     * @constructor
     * @extends BaseController
     */
    function LocalizationApiController(){
        if(pb.config.localization && pb.config.localization.db){
            this.localizationService = new dbLocalizationService();
        } else {
            this.localizationService = new siteLocalizationService();
        }
    }
    util.inherits(LocalizationApiController, pb.BaseController);

    /**
     * Retrieves the translation file and converts it to a JSON.  It then formats
     * it such that it is valid javascript that can be executed client side.
     * @method getAsScript
     * @param {Function} cb
     */
    LocalizationApiController.prototype.getAsScript = function(cb) {
        var locale = this.query.locale || this.ls.language;
        var plugin = this.query.plugin;

        var package = pb.Localization.getLocalizationPackage(locale, { plugin: plugin });
        var content = {
            content: 'var loc = ' + JSON.stringify(package) + ';',
            content_type: 'text/javascript'
        };
        cb(content);
    };

    LocalizationApiController.prototype.saveLocales = function(cb) {
        var post = this.body;
        this.localizationService.saveLocales(post, cb);
    };

    LocalizationApiController.prototype.getLocales = function (cb) {
        var self = this;

        if (!self.query.site || !self.query.plugin || !self.query.lang) {
            return cb({
                code: 500,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, 'no site passed in')
            });
        }

        self.localizationService.getLocales(self.query, function(err, data){
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, data)});
        });

    };

    //exports
    return LocalizationApiController;
};
