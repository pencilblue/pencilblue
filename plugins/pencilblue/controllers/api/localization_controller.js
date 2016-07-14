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

module.exports = function LocalizationApiControllerModule(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     *
     * @class LocalizationApiController
     * @constructor
     * @extends BaseController
     */
    function LocalizationApiController(){}
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

        var pkg = pb.Localization.getLocalizationPackage(locale, { plugin: plugin });
        var content = {
            content: 'var loc = ' + JSON.stringify(pkg) + ';',
            content_type: 'text/javascript'
        };
        cb(content);
    };

    //exports
    return LocalizationApiController;
};
