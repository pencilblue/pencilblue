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
var HtmlEncoder = require('htmlencode');

/**
 * Responsible for formatting an error as XML
 * @class XmlErrorFormatter
 */
class XmlErrorFormatter {

    /**
     * Serializes the object version of the error to be formatted
     * @method serialize
     * @param {object} params
     * @returns {string}
     */
    static serialize(params) {
        return XmlErrorFormatter.serializeXmlObject('error', params);
    }

    /**
     * @static
     * @method serializeXmlPrimitive
     * @param {string} key
     * @param {*} val
     * @returns {string}
     */
    static serializeXmlPrimitive (key, val) {
        return XmlErrorFormatter.startElement(key) + HtmlEncoder.htmlEncode(val + '') + XmlErrorFormatter.endElement(key);
    }

    /**
     * @static
     * @method serializeXmlArray
     * @param {string} key
     * @param {Array} obj
     * @returns {string}
     */
    static serializeXmlArray (key, obj) {
        var xml = '';
        obj.forEach(function(prop, i) {
            var val = obj[prop];
            if (Array.isArray(val)) {
                xml += XmlErrorFormatter.serializeXmlArray(key + '_' + i, val);
            }
            else if (typeof val === 'object') {
                xml += XmlErrorFormatter.serializeXmlObject(key, val);
            }
            else {
                xml += XmlErrorFormatter.serializeXmlPrimitive(key, val);
            }
        });
        return xml;
    }

    /**
     * @static
     * @method serializeXmlObject
     * @param {string} key
     * @param {object} obj
     * @returns {string}
     */
    static serializeXmlObject (key, obj) {
        var xml = XmlErrorFormatter.startElement(key);
        Object.keys(obj).forEach(function(val) {
            if (Array.isArray(val)) {
                xml += XmlErrorFormatter.serializeXmlArray(key, val);
            }
            else if (typeof val === 'object') {
                xml += XmlErrorFormatter.serializeXmlObject(key, val);
            }
            else {
                xml += XmlErrorFormatter.serializeXmlPrimitive(key, val);
            }
        });
        xml += XmlErrorFormatter.endElement(key);
        return xml;
    }

    /**
     * @static
     * @method startElement
     * @param {string} key
     * @returns {string}
     */
    static startElement (key) {
        return '<' + HtmlEncoder.htmlEncode(key) + '>';
    }

    /**
     * @static
     * @method endElement
     * @param {string} key
     * @returns {string}
     */
    static endElement (key) {
        return '</' + HtmlEncoder.htmlEncode(key) + '>';
    }
}

module.exports = XmlErrorFormatter;
