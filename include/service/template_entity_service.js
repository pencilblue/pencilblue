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
var FsEntityService = require('./fs_entity_service');
var log = require('../utils/logging').newInstance('TemplateEntityService');
var TemplateService = require('./entities/template_service');
var ValidationService = require('../validation/validation_service');

/**
 * Service that is used to load the HTML templates from the file system.  If
 * the template is available it is compiled.
 *
 * @module Services
 * @class TemplateEntityService
 * @constructor
 * @param {String} startMarker The string that represents the begining of
 * directives.
 * @param {String} endMarker The string that represents the ending of
 * directives.
 */
class TemplateEntityService extends FsEntityService {
    constructor(startMarker, endMarker) {
        this.type = 'Template';
        this.objType = 'template';
        this.startMarker = startMarker;
        this.endMarker = endMarker;
    }

    /**
     * Retrieve a value from the file system.  Will callback with an object with
     * two properties.  "key" the file path.  "parts" an array of objects.
     *
     * @method get
     * @param  {String} key the file path to the template
     * @param  {Function} cb A callback function that takes two parameters: cb(Error, Object)
     */
    get(key, cb) {
        var self = this;
        var callback = function (err, content) {

            //log result
            if (log.isSilly()) {
                log.silly('TemplateEntityService: Attempted to retrieve template content.  FILE=[%s] CONTENT_LEN=[%s]', key, content ? content.length : 'n/a');
            }

            //compile the content
            var structure = null;
            if (ValidationService.isNonEmptyStr(content, true)) {
                structure = {
                    key: key,
                    parts: TemplateService.compile(content, self.startMarker, self.endMarker)
                };

                if (log.isSilly()) {
                    log.silly('TemplateEntityService: Compiled into %d parts', structure.parts.length);
                }
            }
            cb(err, structure);
        };
        super.get(key, callback);
    };

    /**
     * This function is not implemented.
     *
     * @method set
     * @param {String} key The absolute file path
     * @param {*} value The string content to set
     * @param {Function} cb    Callback function
     */
    set(key, value, cb) {
        throw new Error('Not Supported');
    }
}

module.exports = TemplateEntityService;
