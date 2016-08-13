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
var fs         = require('fs');
var formidable = require('formidable');

module.exports = function (pb) {

    //pb dependencies
    var util = pb.util;
    var BaseController = pb.BaseController;

    /**
     * @class ImportWPActionController
     * @extends BaseController
     * @constructor
     */
    function ImportWPActionController(){}
    util.inherits(ImportWPActionController, BaseController);

    /**
     * @method initSync
     */
    ImportWPActionController.prototype.initSync = function(/*context*/) {
        var WPXMLParseService = pb.PluginService.getService('wp_xml_parse', 'wp_import', this.site);

        /**
         * @property wpXMLParse
         */
        this.wpXmlParse = new WPXMLParseService(this.site);
    };

    /**
     * @method render
     * @param {Function} cb (Error|object)
     */
    ImportWPActionController.prototype.render = function(cb) {
        var self  = this;
        var files = [];
        var form = new formidable.IncomingForm();
        form.on('file', function(field, file) {
            files.push(file);
        });
        form.on('error', function(err) {
            self.session.error = 'loc_NO_FILE';
            cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('INVALID_FILE'))});
        });
        form.parse(this.req, function() {

            fs.readFile(files[0].path, function(err, data) {
                if(util.isError(err)) {
                    self.session.error = 'NO_FILE';
                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_FILE'))});
                    return;
                }

                self.wpXmlParse.parse(data.toString(), self.session.authentication.user_id, function(err, users) {
                    if(util.isError(err)) {
                        self.session.error = err.stack;
                        return cb({content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_SAVING'))});
                    }

                    self.session.importedUsers = users;
                    cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, self.ls.g('WP_IMPORT_SUCCESS'))});
                });
            });
        });
    };

    /**
     * @static
     * @method getRoutes
     * @param {function} cb (Error, Array)
     */
    ImportWPActionController.getRoutes = function(cb) {
        var routes = [
            {
                method: 'post',
                path: '/actions/admin/plugins/wp_import/settings/import',
                auth_required: true,
                inactive_site_access: true,
                access_level: pb.SecurityService.ACCESS_MANAGING_EDITOR,
                content_type: 'text/html'
            }
        ];
        cb(null, routes);
    };

    //exports
    return ImportWPActionController;
};
