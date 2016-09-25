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
var async = require('async');

module.exports = function(pb) {

    //pb dependencies
    var util = pb.util;

    /**
     * Deletes a user
     */
    function DeleteUser(){}
    util.inherits(DeleteUser, pb.BaseController);

    DeleteUser.prototype.render = function(cb) {
        var self    = this;
        var vars    = this.pathVars;

        var message = this.hasRequiredParams(vars, ['id']);
        if (message) {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, message)
            });
            return;
        }

        if(vars.id === self.session.authentication.user_id) {
            cb({
                code: 400,
                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('users.USER_DELETE_SELF'))
            });
            return;
        }

        //ensure existence
        var dao = new pb.DAO();
        dao.loadById(vars.id, 'user', function(err, user) {
            if(user === null) {
                cb({
                    code: 400,
                    content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.INVALID_UID'))
                });
                return;
            }

            // delete the user's comments
            dao.delete({commenter: vars.id}, 'comment', function(err, result) {
                //reassign the user's content to the current user
                self.reassignContent(vars.id, self.session.authentication.user_id, dao, function(err, results) {
                    //delete the user
                    dao.deleteById(vars.id, 'user', function(err, result) {
                        if(util.isError(err) || result < 1) {
                            cb({
                                code: 500,
                                content: pb.BaseController.apiResponse(pb.BaseController.API_FAILURE, self.ls.g('generic.ERROR_DELETING'))
                            });
                            return;
                        }

                        cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, user.username + ' ' + self.ls.g('admin.DELETED'))});
                    });
                });
            });
        });
    };

    DeleteUser.prototype.reassignContent = function(deletedUserId, newUserId, dao, cb) {

        var authorWhere = {
            author: deletedUserId
        };
        var authorUpdate = {
            $set: {
                author: newUserId
            }
        };
        var updateOptions = {
            multi: true
        };
        var tasks = [

            //update articles
            function(callback) {
                dao.updateFields('article', authorWhere, authorUpdate, updateOptions, callback);
            },

             //update pages
            function(callback) {
                dao.updateFields('page', authorWhere, authorUpdate, updateOptions, callback);
            },

            //update sections
            function(callback) {
                var editorWhere = {editor: deletedUserId};
                var editorUpdate = {$set: {editor: newUserId}};
                dao.updateFields('section', editorWhere, editorUpdate, updateOptions, callback);
            }
        ];
        async.parallel(tasks, cb);
    };

    //exports
    return DeleteUser;
};
