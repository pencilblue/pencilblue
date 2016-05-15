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
    var util        = pb.util;
    var UserService = pb.UserService;

    /**
     *
     * @class UserApiController
     * @constructor
     * @extends BaseApiController
     */
    function UserApiController(){}
    util.inherits(UserApiController, pb.BaseApiController);

    /**
     * The regular expression flag for saying ignore case
     * @private
     * @static
     * @readonly
     * @property ANY_CHARS
     * @type {string}
     */
    var IGNORE_CASE = 'i';

    /**
     * The regular expression syntax for saying any character repeated 0 or more times
     * @private
     * @static
     * @readonly
     * @property ANY_CHARS
     * @type {string}
     */
    var ANY_CHARS = '.*';

    /**
     * Initializes the controller
     * @method initSync
     * @param {object} context
     */
    UserApiController.prototype.initSync = function(/*context*/) {

        /**
         * @property service
         * @type {UserService}
         */
        this.service = new UserService(this.getServiceContext());
    };

    /**
     * Retrieves the user object represented by the logged in user
     * @param cb
     */
    UserApiController.prototype.me = function(cb) {
        this.handleGet(cb)(null, this.session.authentication.user);
    };

    /**
     * @method processWhere
     * @param {object} q
     * @returns {object} Two properties, the where clause and the failures array
     */
    UserApiController.prototype.processWhere = function(q) {
        var where = {};
        var failures = [];

        //build query & get results
        var search = q.q;
        if (pb.ValidationService.isNonEmptyStr(search, true)) {

            //build name search
            var tokens = search.split(' ');
            var first = tokens.shift();
            var second = tokens.length > 0 ? tokens.join(' ') : first;
            where.$or = [
                {first_name: new RegExp(util.escapeRegExp(first) + ANY_CHARS, IGNORE_CASE)},
                {last_name: new RegExp(util.escapeRegExp(second) + ANY_CHARS, IGNORE_CASE)},
                {email: new RegExp(util.escapeRegExp(search) + ANY_CHARS, IGNORE_CASE)}
            ];
        }

        //query on admin level
        var role = q.role;
        var isRoleArray;
        if ( (isRoleArray = util.isArray(role)) || pb.ValidationService.isNonEmptyStr(role, true)) {

            //force our processing to be the same
            if (!isRoleArray) {
                role = [role];
            }

            //extract only the integers
            var inArray = [];
            role.forEach(function(r) {
                var accessLevel = parseInt(r);
                if (!isNaN(accessLevel)) {

                    inArray.push(accessLevel);
                }
            });

            //set the IN query
            if (inArray.length > 0) {
                where.admin = {$in: inArray};
            }
        }

        return {
            where: where,
            failures: failures
        };
    };

    //exports
    return UserApiController;
};
