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

module.exports = function(pb) {

    //PB dependencies
    var util            = pb.util;
    var TopicService    = pb.TopicService;

    /**
     *
     * @class TopicApiController
     * @constructor
     * @extends BaseApiController
     */
    function TopicApiController(){}
    util.inherits(TopicApiController, pb.BaseApiController);

    /**
     * Initializes the controller
     * @method initSync
     * @param {Object} context
     */
    TopicApiController.prototype.initSync = function(/*context*/) {

        /**
         * @property service
         * @type {TopicService}
         */
        this.service = new TopicService(this.getServiceContext());
    };

    /**
     * @method processWhere
     * @param {object} q
     * @returns {object} Two properties, the where clause and the failures array
     */
    TopicApiController.prototype.processWhere = function(q) {
        var where = null;
        var failures = [];

        //build query & get results
        var search = q.q;
        if (pb.ValidationService.isNonEmptyStr(search, true)) {

            var patternStr = ".*" + util.escapeRegExp(search) + ".*";
            var pattern = new RegExp(patternStr, "i");
            where = {
              name: pattern
            };
        }

        return {
            where: where,
            failures: failures
        };
    };

    //exports
    return TopicApiController;
};
