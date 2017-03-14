/*
 Copyright (C) 2017  PencilBlue, LLC

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
const log = require('../../../include/utils/logging').newInstance('TemplateCompilationService');
const ValidationService = require('../../../include/validation/validation_service');

class TemplateCompilationService {

    static get DEFAULT_START_MARKER () {
        return '^';
    }

    static get DEFAULT_END_MARKER () {
        return '^';
    }

    static get TEMPLATE_PIECE_STATIC () {
        return 'static';
    }
    static get TEMPLATE_PIECE_FLAG () {
        return 'flag';
    }

    /**
     *
     * @param {string} text
     * @param {object} [options]
     * @param {string} [options.startMarker]
     * @param {string} [options.endMarker]
     * @returns {Array}
     */
    static compile (text, options) {
        options = options || {};

        let start = options.startMarker || TemplateCompilationService.DEFAULT_START_MARKER;
        let end = options.endMarker || TemplateCompilationService.DEFAULT_END_MARKER;
        if (!ValidationService.isNonEmptyStr(text, true)) {
            log.warn('TemplateService: Cannot parse the content because it is not a valid string: '+text);
            return [];
        }

        //generates the proper part form
        var genPiece = function(type, val) {
            return {
                type: type,
                val: val
            };
        };

        var i;
        var flag      = null;
        var staticContent = null;
        var compiled  = [];
        while ( (i = text.indexOf(start)) >= 0) {

            var start_pos = i + start.length;
            var end_pos   = text.indexOf(end, start_pos);
            if (end_pos >= 0) {

                //determine precursing static content & flag
                flag   = text.substring(start_pos, end_pos);
                staticContent = text.substring(0, start_pos - start.length);

                //add the static content
                if (staticContent) {
                    compiled.push(genPiece(TemplateCompilationService.TEMPLATE_PIECE_STATIC, staticContent));
                }

                //add the flag
                if (flag) {
                    compiled.push(genPiece(TemplateCompilationService.TEMPLATE_PIECE_FLAG, flag));
                }

                //cut the text down to after the current flag
                text = text.substring(end_pos + end.length);
                if (!text) {
                    break;
                }
            }
            else {
                break;
            }
        }

        //add what's left
        if (text) {
            compiled.push(genPiece(TemplateCompilationService.TEMPLATE_PIECE_STATIC, text));
        }
        return compiled;
    }
}

module.exports = TemplateCompilationService;
