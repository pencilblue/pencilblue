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

module.exports = function SiteQueryServiceModule(pb) {
  "use strict";

  var SITE_FIELD = pb.SiteService.SITE_FIELD;
  var GLOBAL_SITE = pb.SiteService.GLOBAL_SITE;
  var _ = require('lodash');
  var dao = new pb.DAO();
  var util = pb.util;

  /**
   * Create an instance of the site query service specific to the given site
   *
   * @param {String} siteUId UID of site, should already be sanitized by SiteService
   * @param onlyThisSite {Boolean} for q, return results specific to this site instead of also looking in global
   * @constructor
   */
  function SiteQueryService(siteUId, onlyThisSite) {
    this.siteUId = siteUId;
    this.onlyThisSite = onlyThisSite;
  }

  function modifyLoadWhere(site, where) {
    if (pb.config.multisite) {
      if (Object.isFrozen(where)) {
        where = _.clone(where);
      }
      if (site === pb.SiteService.GLOBAL_SITE) {
        var siteDoesNotExist = {}, siteEqualToSpecified = {};
        siteDoesNotExist[SITE_FIELD] = {$exists: false};
        siteEqualToSpecified[SITE_FIELD] = site;

        addToOr(where, [siteDoesNotExist, siteEqualToSpecified]);
      } else {
        where[SITE_FIELD] = site;
      }
    }
    return where;
  }

  function modifyLoadOptions(site, options) {
    if (pb.config.multisite) {
      var target;
      if (!Object.isFrozen(options)) {
        target = options;
      } else {
        target = _.clone(options);
      }
      target.where = target.where || {};
      target.where = modifyLoadWhere(site, target.where);
      return target;
    }
    // else do nothing
    return options;
  }

  function addToOr(whereClause, conditions) {
    if ('$or' in whereClause) {
      var orClause = whereClause.$or;
      addToAnd(whereClause, [{$or: orClause}, {$or: conditions}]);
      delete whereClause.$or;
    } else {
      whereClause.$or = conditions;
    }
  }

  function addToAnd(whereClause, conditions) {
    if ('$and' in whereClause) {
      var andClause = whereClause.$and;
      andClause.push.apply(andClause, conditions);
    } else {
      whereClause.$and = conditions;
    }
  }

  /**
   * Wrapper for site-aware DAO.q, search target collection with specified site
   * If onlyThisSite is not true, and this service is instantiated with a non-global site, then
   * this value will try to re-run this query against global site if no docs were found with specified site
   *
   * @param collection
   * @param options
   * @param callback
   */
  SiteQueryService.prototype.q = function (collection, options, callback) {
    if (util.isFunction(options)) {
      callback = options;
      options = {};
    }

    options = modifyLoadOptions(this.siteUId, options);
    if (this.onlyThisSite || isGlobal(this.siteUId)) {
      dao.q(collection, options, callback);
    } else {
      dao.q(collection, options, function (err, docs) {
        if (util.isError(err) || docs) {
          callback(err, docs);
        } else {
          options = modifyLoadOptions(GLOBAL_SITE, options);
          dao.q(collection, options, callback);
        }
      });
    }
  };

  function isGlobal(siteUId) {
    return !siteUId || siteUId === GLOBAL_SITE;
  }

  /**
   * Wrapper for site-aware DAO.exists. Determines if an object exists matching criteria with the specified site.
   *
   * @method exists
   * @param  {String}   collection The collection to search in
   * @param  {Object}   where      Key value pair object
   * @param  {Function} cb         Callback function
   */
  SiteQueryService.prototype.exists = function(collection, where, cb) {
    where = modifyLoadWhere(this.siteUId, where);
    dao.exists(collection, where, cb)
  };

  /**
   * Wrapper for site-aware DAO.unique, determine if the document matching the query is unique within specified site
   * Only searches within specified site.
   *
   * @param collection
   * @param where
   * @param exclusionId
   * @param callback
   */
  SiteQueryService.prototype.unique = function (collection, where, exclusionId, callback) {
    where = modifyLoadWhere(this.siteUId, where);
    dao.unique(collection, where, exclusionId, callback);
  };

  /**
   * Wrapper for site-aware DAO.save.  Saves object to database
   *
   * @param dbObj
   * @param options
   * @param callback
   */
  SiteQueryService.prototype.save = function (dbObj, options, callback) {
    dbObj = modifySave(this.siteUId, dbObj);
    dao.save(dbObj, options, callback);
  };

  /**
   * Proxy for DAO.loadByValue; Retrieves objects matching a key value pair
   *
   * @method loadByValue
   * @param {String}   key        The key to search for
   * @param {*}        value      The value to search for
   * @param {String}   collection The collection to search in
   * @param {Object}   options    Key value pair object to exclude the retrival of data
   * @param {Function} callback   Callback function
   */
  SiteQueryService.prototype.loadByValue = function (key, value, collection, options, callback) {
    var where = {};
    where[key] = value;
    this.loadByValues(where, collection, options, callback);
  };

  /**
   * Wrapper for DAO.loadByValues. Retrieves object matching several key value pairs
   *
   * @method loadByValues
   * @param {Object}   where      Key value pair object
   * @param {String}   collection The collection to search in
   * @param {Object}   options    Key value pair object to exclude the retrieval of data
   * @param {Function} callback   Callback function
   */
  SiteQueryService.prototype.loadByValues = function(where, collection, options, callback) {
    where = modifyLoadWhere(this.siteUId, where);
    dao.loadByValues(where, collection, options, callback);
  };

  /**
   * Proxy for DAO.loadById; loads an object by its id, but its site must also match the query service's site
   *
   * @method loadById
   * @param {String}   id         The unique id of the object
   * @param {String}   collection The collection the object is in
   * @param {Object}   options    Key value pair object to exclude the retrival of data
   * @param {Function} callback   Callback function
   */
  SiteQueryService.prototype.loadById = function (id, collection, options, callback) {
    this.loadByValues(pb.DAO.getIdWhere(id), collection, options, callback);
  };

  /**
   * Wrapper for DAO.count; Gets the count of objects matching criteria
   *
   * @method count
   * @param  {String}   entityType The type of object to search for
   * @param  {Object}   where      Key value pair object
   * @param  {Function} callback         Callback function
   */
  SiteQueryService.prototype.count = function (entityType, where, callback) {
    where = modifyLoadWhere(this.siteUId, where);
    dao.count(entityType, where, callback);
  };

  function modifySave(site, objectToSave) {
    if (pb.config.multisite && !(SITE_FIELD in objectToSave)) {
      objectToSave[SITE_FIELD] = site;
    }
    // else do nothing
    return objectToSave;
  }

  return SiteQueryService;
};