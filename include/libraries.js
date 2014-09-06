/*
    Copyright (C) 2014  PencilBlue, LLC

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

/**
 * Service for library settings retrieval
 *
 * @module Services
 * @class LibrariesService
 * @constructor
 */
function LibrariesService(){}

/**
 * Retrieves the library settings
 *
 * @method getSettings
 * @param {Function} cb Callback function
 */
LibrariesService.getSettings = function(cb){
    pb.settings.get('libraries_settings', function(err, settings){
        if(settings === null) {
            settings = LibrariesService.getCDNDefaults();
            pb.settings.set('libraries_settings', settings, pb.utils.cb);
        }
        else {
            // Replace any missing libraries with CDN defaults
            var newSettings = LibrariesService.getCDNDefaults();
            pb.utils.merge(settings, newSettings);
            settings = newSettings;
        }
        cb(err, settings);
    });
};

/**
 * Loads the libraries settings into template service globals. Called on system
 * startup
 *
 * @method init
 * @param  {Function} cb Callback function
 */
LibrariesService.init = function(cb) {
    LibrariesService.getSettings(function(err, settings) {
        if(util.isError(err)) {
            cb(err);
            return;
        }

        for(var key in settings) {
            pb.TemplateService.registerGlobal(key + '_src', settings[key]);
        }

        cb(null, true);
    });
};

/**
 * Retrieves the default library settings for CDNs
 *
 * @method getCDNDefaults
 * @return {Object} CDN defaults
 */
LibrariesService.getCDNDefaults = function() {
    return {
        jquery: '//code.jquery.com/jquery-1.11.1.min.js',
        jquery_ui_js: '//code.jquery.com/ui/1.10.4/jquery-ui.min.js',
        jquery_ui_css: '//code.jquery.com/ui/1.10.4/themes/ui-lightness/jquery-ui.css',
        jquery_ui_touch_punch: '//cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js',
        jquery_file_upload_js: '/js/lib/jquery/jquery.fileupload.js',
        jquery_file_upload_css: '/css/lib/jquery/jquery.fileupload.css',
        jquery_iframe_transport: '/js/lib/jquery/jquery.iframe-transport.js',
        jquery_datetime_picker_js: '/js/lib/jquery/jquery.datetimepicker.min.js',
        jquery_datetime_picker_css: '/css/lib/jquery/jquery.datetimepicker.min.css',
        jquery_validate: '//ajax.aspnetcdn.com/ajax/jquery.validate/1.12.0/jquery.validate.min.js',
        bootstrap_js: '//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js',
        bootstrap_css: '//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css',
        font_awesome: '//netdna.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css',
        angular: '//ajax.googleapis.com/ajax/libs/angularjs/1.2.15/angular.min.js',
        angular_route: '//ajax.googleapis.com/ajax/libs/angularjs/1.2.15/angular-route.min.js',
        angular_sanitize: '//ajax.googleapis.com/ajax/libs/angularjs/1.2.15/angular-sanitize.min.js',
        spin: '//fgnass.github.io/spin.js/spin.min.js',
        jquery_spin: '//fgnass.github.io/spin.js/jquery.spin.js',
        he: '/js/lib/he/he.js',
        to_markdown: '/js/lib/to_markdown/to-markdown.js',
        markdown: '/js/lib/markdown/lib/markdown.js'
    };
};

/**
 * Retrieves the default library settings for Bower
 *
 * @method getBowerDefaults
 * @return {Object} Bower defaults
 */
LibrariesService.getBowerDefaults = function() {
    return {
        jquery: '/bower_components/jquery/dist/jquery.min.js',
        jquery_ui_js: '/bower_components/jqueryui/jquery-ui.min.js',
        jquery_ui_css: '/bower_components/jqueryui/themes/ui-lightness/jquery-ui.min.css',
        jquery_ui_touch_punch: '/bower_components/jqueryui-touch-punch/jquery.ui.touch-punch.min.js',
        jquery_file_upload_js: '/bower_components/jquery-file-upload/js/jquery.fileupload.js',
        jquery_file_upload_css: '/bower_components/jquery-file-upload/css/jquery.fileupload.css',
        jquery_iframe_transport: '/bower_components/jquery.iframe-transport/jquery.iframe-transport.js',
        jquery_datetime_picker_js: '/bower_components/datetimepicker/jquery.datetimepicker.js',
        jquery_datetime_picker_css: '/bower_components/datetimepicker/jquery.datetimepicker.css',
        jquery_validate: '/bower_components/jquery.validation/dist/jquery.validate.min.js',
        bootstrap_js: '/bower_components/bootstrap/dist/js/bootstrap.min.js',
        bootstrap_css: '/bower_components/bootstrap/dist/css/bootstrap.min.css',
        font_awesome: '/bower_components/fontawesome/css/font-awesome.min.css',
        angular: '/bower_components/angular/angular.min.js',
        angular_route: '/bower_components/angular-route/angular-route.min.js',
        angular_sanitize: '/bower_components/angular-sanitize/angular-sanitize.min.js',
        spin: '/bower_components/jquery.spinjs/libs/spin/spin.js',
        jquery_spin: '/bower_components/jquery.spinjs/dist/jquery.spin.min.js',
        he: '/bower_components/he/he.js',
        to_markdown: '/bower_components/to-markdown/src/to-markdown.js',
        markdown: '/bower_components/markdown/lib/markdown.js'
    };
};

//exports
module.exports.LibrariesService = LibrariesService;
