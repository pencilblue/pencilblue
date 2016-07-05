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

//dependencies
var util = require('../../../util.js');

module.exports = function(pb) {

    /**
     * Retrieves the necessary data as well as prepares the layout so a view
     * loader can complete the render of content
     * @class PageRenderer
     * @constructor
     * @param {object} context
     */
    function PageRenderer(context) {

        /**
         *
         * @property commentService
         * @type {CommentService}
         */
        this.commentService = new pb.CommentService(context);

        PageRenderer.super_.call(this, context);
    }
    util.inherits(PageRenderer, pb.ArticleRenderer);

    /**
     * @method getContentLinkPrefix
     * @return {String}
     */
    PageRenderer.prototype.getContentLinkPrefix = function() {
        return '/page/';
    };

    /**
     * Retrieves the layout from the content object. Provides a mechanism to
     * allow for layout parameter to have any name.
     * @method getLayout
     * @param {Object} content
     * @return {String}
     */
    PageRenderer.prototype.getLayout = function(content) {
        return content.page_layout;
    };

    /**
     * A workaround to allow this prototype to operate on articles and pages.
     * The layout parameter is not the same.  Until we introduce breaking
     * changes this will have to do.
     * @method setLayout
     * @param {Object} content
     * @param {String} layout
     */
    PageRenderer.prototype.setLayout = function(content, layout) {
        content.page_layout = layout;
    };

    return PageRenderer;
};
