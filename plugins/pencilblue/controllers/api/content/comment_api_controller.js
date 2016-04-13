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

module.exports = function(pb) {

    //PB dependencies
    var util           = pb.util;
    var CommentService = pb.CommentService;

    /**
     *
     * @class CommentApiController
     * @constructor
     * @extends BaseApiController
     */
    function CommentApiController(){}
    util.inherits(CommentApiController, pb.BaseApiController);

    /**
     * Initializes the controller
     * @method initSync
     * @param {object} context
     */
    CommentApiController.prototype.initSync = function(/*context*/) {

        /**
         * @property service
         * @type {CommentService}
         */
        this.service = new CommentService(this.getServiceContext());
    };

    /**
     * @method processWhere
     * @param {object} q
     * @returns {object} Two properties, the where clause and the failures array
     */
    CommentApiController.prototype.processWhere = function(q) {
        var where = {};
        var failures = [];

        //build query & get results
        var user = q.user;
        if (pb.ValidationService.isIdStr(user, true)) {
            where.commenter = user;
        }

        return {
            where: where,
            failures: failures
        };
    };

    //exports
    return CommentApiController;
};
