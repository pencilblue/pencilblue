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
var _ = require('lodash');

module.exports = function SiteQueryServiceModule(pb) {
    "use strict";

    //pb dependencies
    var util = pb.util;
    var DAO = pb.DAO;

    /**
     * @private
     * @static
     * @readonly
     * @property SITE_FIELD
     * @type {String}
     */
    var SITE_FIELD = pb.SiteService.SITE_FIELD;

    /**
     * @private
     * @static
     * @readonly
     * @property GLOBAL_SITE
     * @type {String}
     */
    var GLOBAL_SITE = pb.SiteService.GLOBAL_SITE;

  /**
   * Create an instance of the site query service specific to the given site
   *
   * @module Services
   * @class SiteQueryService
   * @constructor
   * @extends DAO
   * @param {Object} options
   * @param {String} [options.site=GLOBAL_SITE] UID of site, should already be sanitized by SiteService
   * @param {Boolean} [options.onlyThisSite=false] onlyThisSite for q, return results specific to this site instead of also looking in global
   */
    function SiteQueryService(options) {
        if(!util.isObject(options)) {
            options = {
                site: GLOBAL_SITE,
                onlyThisSite: false
            };
        }

        /**
         * @property siteUid
         * @type {String}
         */
        this.siteUid = options.site;

        /**
         * @property onlyThisSite
         * @type {Boolean}
         */
        this.onlyThisSite = options.onlyThisSite;

        DAO.call(this);
    }
    util.inherits(SiteQueryService, DAO);

    /**
     * Given an existing where object to search, add site parameter to the where object so that the returned where searches for object belonging to the site specified by this service's constructor and by the original where object
     *
     * If the site is global, also look for objects where site is not set for backwards compatibility
     *
     * @private
     * @static
     * @method addSiteToWhere
     * @param {String} site
     * @param {Object} where
     * @return {Object}
     */
  function addSiteToWhere(site, where) {
    if (pb.config.multisite.enabled) {
      where = _.cloneDeep(where);
      if (site === GLOBAL_SITE) {
        var siteDoesNotExist = {}, siteEqualToSpecified = {};
        siteDoesNotExist[SITE_FIELD] = {$exists: false};
        siteEqualToSpecified[SITE_FIELD] = site;

        addToOr(where, [siteDoesNotExist, siteEqualToSpecified]);
      }
      else {
        where[SITE_FIELD] = site;
      }
    }
    return where;
  }

    /**
     * @private
     * @static
     * @method modifyLoadOptions
     * @param {String} site
     * @param {Object} options
     * @return {Object}
     */
  function modifyLoadOptions(site, options) {
    if (pb.config.multisite.enabled) {
      var target = _.clone(options);

      target.where = target.where || {};
      target.where = addSiteToWhere(site, target.where);
      return target;
    }
    // else do nothing
    return options;
  }

    /**
     * @private
     * @static
     * @method addToOr
     * @param {Object} whereClause
     * @param {Array} conditions
     */
  function addToOr(whereClause, conditions) {
    if ('$or' in whereClause) {
      var orClause = whereClause.$or;
      addToAnd(whereClause, [{$or: orClause}, {$or: conditions}]);
      delete whereClause.$or;
    }
      else {
      whereClause.$or = conditions;
    }
  }

    /**
     * @private
     * @static
     * @method addToAnd
     * @param {Object} whereClause
     * @param {Array} conditions
     */
    function addToAnd(whereClause, conditions) {
        if ('$and' in whereClause) {
            var andClause = whereClause.$and;
            andClause.push.apply(andClause, conditions);
        }
        else {
            whereClause.$and = conditions;
        }
    }

    /**
     * @private
     * @static
     * @method applySiteOperation
     * @param {SiteQueryService} self
     * @param {Function} callback
     * @param {Function} delegate
     */
    function applySiteOperation(self, callback, delegate) {
        if (siteSpecific(self)) {
            return delegate(self.siteUid, callback);
        }

        delegate(self.siteUid, function (err, cursor) {
            if (util.isError(err)) {
                return callback(err, cursor);
            }

            cursor.count(function (countError, count) {
                if (util.isError(countError)) {
                    callback(countError);
                }
                else if (count) {
                    callback(err, cursor);
                }
                else {
                    delegate(GLOBAL_SITE, callback);
                }
            });
        });
    }

    /**
     * @private
     * @method siteSpecific
     * @param {SiteQueryService} self
     * @return {Boolean}
     */
    function siteSpecific(self) {
        return self.onlyThisSite || isGlobal(self.siteUid);
    }

    /**
     * @private
     * @method isGlobal
     * @param {String} siteUid
     * @return {Boolean}
     */
    function isGlobal(siteUid) {
        return !siteUid || siteUid === GLOBAL_SITE;
    }

    /**
     * @private
     * @method modifySave
     * @param {String} site
     * @param {Object} objectToSave
     * @return {Object} The object to save
     */
    function modifySave(site, objectToSave) {
        if (pb.config.multisite.enabled && !(SITE_FIELD in objectToSave)) {
            objectToSave[SITE_FIELD] = site;
        }
        // else do nothing
        return objectToSave;
    }

  /**
   * Overriding protected method of DAO to achieve site-aware query
   * @protected
   * @method _doQuery
   * @param {Object} options
   * @param {Function} callback
   */
  SiteQueryService.prototype._doQuery = function (options, callback) {
    var self = this;
    applySiteOperation(self, callback, function (site, opCallback) {
      var moddedOptions = modifyLoadOptions(site, options);
      DAO.prototype._doQuery.call(self, moddedOptions, opCallback);
    });
  };

  /**
   * Overriding DAO delete method for sites, removes objects from persistence that match criteria and on the site specified
   *
   * @method delete
   * @param {Object} where Key value pair object
   * @param {String} collection The collection to search in
   * @param {Object} [options] See http://mongodb.github.io/node-mongodb-native/api-generated/collection.html#remove
   * @param {Function} cb A callback that provides two parameter. The first is an
   * error, if occurred.  The second is the number of records that were removed
   * from persistence.
   */
  SiteQueryService.prototype.delete = function (where, collection, options, cb) {
      let modifiedWhere = addSiteToWhere(this.siteUid, where);
      return DAO.prototype.delete.call(this, modifiedWhere, collection, options, cb);
  };

  /**
   * Wrapper for site-aware DAO.save.  Saves object to database
   * @method save
   * @param {Object} dbObj
   * @param {Object} [options]
   * @param {Function} callback
   */
  SiteQueryService.prototype.save = function (dbObj, options, callback) {
    dbObj = modifySave(this.siteUid, dbObj);
    DAO.prototype.save.call(this, dbObj, options, callback);
  };

  /**
   * Gets all collection names
   * @method getCollections
   * @param {Function} cb
   */
  SiteQueryService.prototype.getCollections = function (cb) {
    this.listCollections({}, function(err, items) {
      if(pb.util.isError(err)) {
        pb.log.error(err);
        return cb(err);
      }

      items = items.filter(function(item) {
        return item.name.indexOf('system.indexes') === -1 && item.name.indexOf('system.namespaces') === -1;
      });

      cb(err, items);
    });
  };

  /**
   * Deletes all site specific content
   * @param {Array} collections -  array of collection names
   * @param {String} siteid - unique site id
   * @param {Function} callback - callback function
   */
  SiteQueryService.prototype.deleteSiteSpecificContent = function (collections, siteid, callback) {
    var self = this;
    var BaseObjectService = pb.BaseObjectService;

    SiteService.siteExists(siteid, function (err, exists) {
      if (util.isError(err)) {
        return callback(err);
      }

      if (!exists) {
        return callback(BaseObjectService.validationError([BaseObjectService.validationFailure("siteid", "Invalid siteid")]));
      }

      var tasks = util.getTasks(collections, function (collections, i) {
        return function (taskCallback) {
          self.delete({site: siteid}, collections[i].name, function (err, commandResult) {
            if (util.isError(err) || !commandResult) {
              return taskCallback(err);
            }

            var numberOfDeletedRecords = commandResult.result.n;
            pb.log.silly(numberOfDeletedRecords + " site specific " + collections[i].name + " records associated with " + siteid + " were deleted");
            taskCallback(null, {collection: collections[i].name, recordsDeleted: numberOfDeletedRecords});
          });
        };
      });
      async.parallel(tasks, function(err, results) {
        if (pb.util.isError(err)) {
          pb.log.error(err);
          return callback(err);
        }
        self.delete({uid: siteid}, 'site', function(err/*, result*/) {
          if (util.isError(err)) {
            pb.log.error("SiteQueryService: Failed to delete site: %s \n%s", siteid, err.stack);
            return callback(err);
          }
          pb.log.silly("Successfully deleted site %s from database: ", siteid);
          callback(null, results);
        });
      });
    });
  };

  return SiteQueryService;
};
