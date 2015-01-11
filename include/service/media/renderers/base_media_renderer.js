
//dependencies
var HtmlEncoder = require('htmlencode');

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
 *
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
 *
 * @static
 * @method getAttributeStr
 * @return {String}
 */
BaseMediaRenderer.getAttributeStr = function(attr) {
    if (!pb.utils.isObject(attr)) {
        return null;
    }
    
    var attrStr = '';
    for (var key in attr) {
        attrStr += key + '="' + HtmlEncoder.htmlEncode(attr[key]) + '" ';
    }
    return attrStr;
};

/**
 *
 * @static
 * @method getStyleAttrStr
 * @return {String}
 */
BaseMediaRenderer.getStyleAttrStr = function(style) {
    if (!pb.utils.isObject(style)) {
        return null;
    }
    else if (Object.keys(style).length === 0) {
        return '';
    }
    
    var styleStr = 'style="';
    for (var key in style) {
        styleStr += key + ':' + HtmlEncoder.htmlEncode(style[key] + '') + ';';
    }
    styleStr += '" ';console.log('***'+styleStr);
    return styleStr;
}

//exports
module.exports = BaseMediaRenderer;
