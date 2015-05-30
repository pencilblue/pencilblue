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
var util = require('../util.js');

/**
 * Theme content services
 *
 * @module Services
 * @submodule Theme
 */
module.exports = function CommentServiceModule(pb) {
    
    //pb dependencies
    var BaseObjectService = pb.BaseObjectService;
    
    /**
     * Retrieves comment information
     *
     * @module Services
     * @submodule Theme
     * @class CommentService
     * @extends BaseObjectService
     * @constructor
     * @param {Object} context
     */
    function CommentService(context){
        if (!util.isObject(context)) {
            context = {};
        }
        
        context.type = TYPE;
        CommentService.super_.call(this, context);
    }
    util.inherits(CommentService, BaseObjectService);
    
    /**
     * @private
     * @static
     * @readonly
     * @property TYPE
     * @type {String}
     */
    var TYPE = 'comment';

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
    
    /**
     * 
     * @static
     * @method 
     * @param {Object} context
     * @param {TopicService} service An instance of the service that triggered 
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    CommentService.format = function(context, cb) {
        var dto = context.data;
        dto.article = BaseObjectService.sanitize(dto.article);
        dto.content = BaseObjectService.sanitize(dto.content);
        cb(null);
    };
    
    /**
     * 
     * @static
     * @method 
     * @param {Object} context
     * @param {TopicService} service An instance of the service that triggered 
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    CommentService.merge = function(context, cb) {
        context.object.name = context.data.name;
        cb(null);
    };
    
    /**
     * 
     * @static
     * @method validate
     * @param {Object} context
     * @param {Object} context.data The DTO that was provided for persistence
     * @param {TopicService} context.service An instance of the service that triggered 
     * the event that called this handler
     * @param {Function} cb A callback that takes a single parameter: an error if occurred
     */
    CommentService.validate = function(context, cb) {
        var obj = context.data;
        var errors = context.validationErrors;
        cb(null);
    };
    
    //Event Registries
    BaseObjectService.on(TYPE + '.' + BaseObjectService.FORMAT, CommentService.format);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.MERGE, CommentService.merge);
    BaseObjectService.on(TYPE + '.' + BaseObjectService.VALIDATE, CommentService.validate);

    //exports
    return CommentService;
};
