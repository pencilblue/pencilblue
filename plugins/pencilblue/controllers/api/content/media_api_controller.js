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
    var util         = pb.util;
    var MediaService = pb.MediaService;

    /**
     *
     * @class MediaApiController
     * @constructor
     * @extends BaseApiController
     */
    function MediaApiController(){}
    util.inherits(MediaApiController, pb.BaseApiController);

    /**
     * Initializes the controller
     * @method initSync
     * @param {object} context
     */
    MediaApiController.prototype.initSync = function(context) {
        this.service = new MediaService(null, context.site, context.onlyThisSite);
    };

    /**
     * Processes the query string to develop the where clause for the query request
     * @method processWhere
     * @param {Object} q The hash of all query parameters from the request
     * @return {Object}
     */
    MediaApiController.prototype.processWhere = function(q) {
        var where = null;
        var failures = [];

        //build query & get results
        var search = q.q;
        if (pb.ValidationService.isNonEmptyStr(search, true)) {

            var patternStr = ".*" + util.escapeRegExp(search) + ".*";
            var pattern = new RegExp(patternStr, "i");
            where = {
                $or: [
                    {name: pattern},
                    {caption: pattern},
                ]
            };
        }

        var topicId = q.topic;
        if (pb.ValidationService.isIdStr(topicId, true)) {
            where = where || {};
            where.media_topics = topicId;
        }

        return {
            where: where,
            failures: failures
        };
    };

    /**
     * Retrieves media
     * @method getAll
     * @param {Function} cb
     */
    MediaApiController.prototype.getAll = function(cb) {
        var options = this.processQuery();
        this.service.get(options, this.handleGet(cb));
    };

    //exports
    return MediaApiController;
};
