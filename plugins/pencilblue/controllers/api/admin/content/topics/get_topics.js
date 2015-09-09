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

module.exports = function(pb) {
  //pb dependencies
  var util = pb.util;

  /**
   * Interface for managing topics
   */
  function GetTopics() {}
  util.inherits(GetTopics, pb.BaseAdminController);

  /**
   * Initializes the controller
   * @method init
   * @param {Object} context
   * @param {Function} cb
   */
  GetTopics.prototype.init = function(context, cb) {
    var self = this;
    var init = function(err) {
      /**
       *
       * @property service
       * @type {TopicService}
       */
      self.service = new pb.TopicService(self.getServiceContext());

      cb(err, true);
    };
    GetTopics.super_.prototype.init.apply(this, [context, init]);
  };

  GetTopics.prototype.render = function(cb) {
    var self = this;

    this.service.getAll(function(err, topics) {
      if(util.isError(err)) {
        return cb({
          code: 400,
          content: pb.BaseController.apiResponse(pb.BaseController.API_ERROR, err)
        });
      }

      //currently, mongo cannot do case-insensitive sorts.  We do it manually
      //until a solution for https://jira.mongodb.org/browse/SERVER-90 is merged.
      topics.sort(function(a, b) {
        var x = a.name.toLowerCase();
        var y = b.name.toLowerCase();

        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
      });

      cb({content: pb.BaseController.apiResponse(pb.BaseController.API_SUCCESS, '', topics)});
    });
  };

  //exports
  return GetTopics;
};
