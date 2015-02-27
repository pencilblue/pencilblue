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

//dependencies
var HtmlEncoder = require('htmlencode');

module.exports = function BaseMediaRenderer(pb) {
    
    //pb dependencies
    var util = pb.util;

    /**
     * Provides functions to provide common functionality among media renderers
     * @class BaseMediaRenderer
     * @constructor
     */
    function BaseMediaRenderer() {}

    /**
     * Renders an iframe element
     * @static
     * @method renderSingleElementEmbed
     * @return {String} HTML
     */
    BaseMediaRenderer.renderIFrameEmbed = function(srcUrl, attrs, style) {
        return BaseMediaRenderer.renderSingleElementEmbed('iframe', srcUrl, attrs, style);
    };

    /**
     * Renders a single element
     * @static
     * @method renderSingleElementEmbed
     * @return {String} HTML
     */
    BaseMediaRenderer.renderSingleElementEmbed = function(elementName, srcUrl, attrs, style) {
        if (!attrs) {
            attrs = {};
        }
        if (!style) {
            style = {};
        }

        return '<'+elementName+' src="' + HtmlEncoder.htmlEncode(srcUrl) + '" ' + 
            BaseMediaRenderer.getAttributeStr(attrs) + 
            BaseMediaRenderer.getStyleAttrStr(style) + 
            '></' + elementName + '>';
    };

    /**
     * Generates an attribute string from a hash of key/value pairs
     * @static
     * @method getAttributeStr
     * @return {String}
     */
    BaseMediaRenderer.getAttributeStr = function(attr) {
        if (!util.isObject(attr)) {
            return null;
        }

        var attrStr = '';
        util.forEach(attr, function(value, key/*, attr, i*/) {
            attrStr += key + '="' + HtmlEncoder.htmlEncode(value + '') + '" ';
        });
        return attrStr;
    };

    /**
     * Generates a style string from a hash of key/value pairs.  The string 
     * includes the 'sytle="[STUFF HERE]"' wrapper
     * @static
     * @method getStyleAttrStr
     * @return {String}
     */
    BaseMediaRenderer.getStyleAttrStr = function(style) {
        if (!util.isObject(style)) {
            return null;
        }
        else if (Object.keys(style).length === 0) {
            return '';
        }

        var styleStr = 'style="';
        util.forEach(style, function(value, key/*, style, i*/) {
            styleStr += key + ':' + HtmlEncoder.htmlEncode(value + '') + ';';
        });
        styleStr += '" ';
        return styleStr;
    }

    //exports
    return BaseMediaRenderer;
};
