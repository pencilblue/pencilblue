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
 * Theme content services
 *
 * @module Services
 * @submodule Theme
 */

/**
 * Retrieves comment information
 *
 * @module Services
 * @submodule Theme
 * @class CommentService
 * @constructor
 */
function CommentService(){}

/**
 * Retrieves the template for comments
 *
 * @method getCommentsTemplates
 * @param {Object} contentSettings The content settings to use with retrieval
 * @param {Function} output        Callback function
 */
CommentService.getCommentsTemplates = function(contentSettings, output) {
    var self = this;

    if(!contentSettings.allow_comments) {
        output('');
        return;
    }

    //TODO move this out of here.
    var ts = new pb.TemplateService();
    ts.load('elements/comments', function(err, commentsContainer) {
        ts.load('elements/comments/comment', function(err, comment) {
            output({commentsContainer: commentsContainer, comment: comment});
        });
    });
};

/**
 * Retrieves the necessary user information for a commenter
 *
 * @method getCommentingUser
 * @param {Object} user A user object
 */
CommentService.getCommentingUser = function(user) {
    return {
    	photo: user.photo,
    	name: pb.users.getFormattedName(user),
    	position: user.position
	};
};

//exports
module.exports = CommentService;
