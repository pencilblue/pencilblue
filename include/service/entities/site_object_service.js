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

var async = require('async');

module.exports = function (pb) {
  //pb dependencies
  var util = pb.util;
  var BaseObjectService = pb.BaseObjectService;
  var SiteService = pb.SiteService;

  /**
   * SiteObjectService
   * @class SiteObjectService
   * @constructor
   * @extends BaseObjectService
   */
  function SiteObjectService(context) {
    if (!util.isObject(context)) {
      context = {};
    }

    context.type = TYPE;
    SiteObjectService.super_.call(this, context);
    this.siteService = new SiteService();

    pb.BaseObjectService.on(TYPE + '.' + pb.BaseObjectService.MERGE, SiteObjectService.merge);
  }

  util.inherits(SiteObjectService, BaseObjectService);

  /**
   * The name of the DB collection where the resources are persisted
   * @private
   * @static
   * @readonly
   * @property TYPE
   * @type {String}
   */
  var TYPE = 'site';

  /**
   * The name the service
   * @private
   * @static
   * @readonly
   * @property SERVICE_NAME
   * @type {String}
   */
  var SERVICE_NAME = 'SiteObjectService';

  /**
   * A service interface function designed to allow developers to name the handle
   * to the service object what ever they desire. The function must return a
   * valid string and must not conflict with the names of other services for the
   * plugin that the service is associated with.
   *
   * @static
   * @method getName
   * @return {String} The service name
   */
  SiteObjectService.getName = function () {
    return SERVICE_NAME;
  };

  SiteObjectService.merge = function (context, cb) {
    pb.util.merge(context.data, context.object);
    cb(null);
  };

  SiteObjectService.prototype.deleteSiteSpecificContent = function (collections, siteid, callback) {
    var self = this;

    SiteService.siteExists(siteid, function (err, exists) {
      if (util.isError(err)) {
        return callback(err);
      }

      if (!exists) {
        return callback(BaseObjectService.validationError([BaseObjectService.validationFailure("siteid", "Invalid siteid")]));
      }

      var tasks = util.getTasks(collections, function (collections, i) {
        return function (taskCallback) {
          self.dao.delete({site: siteid}, collections[i].name, function (err, commandResult) {
            if (util.isError(err) || !commandResult) {
              return taskCallback(err);
            }

            var numberOfDeletedRecords = commandResult.result.n;
            pb.log.silly(numberOfDeletedRecords + " site specific " + collections[i].name + " records associated with " + siteid + " were deleted");
            taskCallback(null, {collection: collections[i].name, recordsDeleted: numberOfDeletedRecords});
          });
        };
      });
      async.parallel(tasks, function (err, results) {
        if (pb.util.isError(err)) {
          pb.log.error(err);
          return callback(err);
        }
        self.dao.delete({uid: siteid}, 'site', function (err/*, result*/) {
          if (util.isError(err)) {
            pb.log.error("SiteQueryService: Failed to delete site: %s \n%s", siteid, err.stack);
            return callback(err);
          }
          pb.log.silly("Successfully deleted site %s from database: ", siteid);
          callback(null, results);
        });
      });

      //Once the site's deleted locally, attempt to delete it from AWS
      self.siteService.getByUid(siteid, function (err, results) {
        self._emit(BaseObjectService.AFTER_DELETE, {hostname: results.hostname});
      });
    });
  };

  //exports
  return SiteObjectService;
};