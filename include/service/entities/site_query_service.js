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


    }
    // else do nothing
    return options;
  }

  function addToOr(whereClause, conditions) {
    if ('$or' in whereClause) {
      var orClause = whereClause['$or'];
      orClause.push.apply(orClause, conditions);
    } else {
      whereClause['$or'] = conditions;
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
    dao.q(collection, where, exclusionId, callback);
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

  function modifySave(site, objectToSave) {
    if (pb.config.multisite && !(SITE_FIELD in objectToSave)) {
      objectToSave[SITE_FIELD] = site;
    }
    // else do nothing
    return objectToSave;
  }

  return SiteQueryService;
};