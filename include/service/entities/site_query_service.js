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
const _ = require('lodash');
const Configuration = require('../../config');
const DAO = require('./../../dao/dao.js');
const log = require('../../utils/logging').newInstance('SiteQueryService');
const SiteService = require('./site_service');

  /**
   * Create an instance of the site query service specific to the given site
   *
   * @module Services
   * @class SiteQueryService
   * @constructor
   * @extends DAO
   * @param {Object} options
   * @param {String} [options.site=SiteService.GLOBAL_SITE] UID of site, should already be sanitized by SiteService
   * @param {Boolean} [options.onlyThisSite=false] onlyThisSite for q, return results specific to this site instead of also looking in global
   */
    class SiteQueryService extends DAO {
      constructor(options) {
          if (!_.isObject(options)) {
              options = {
                  site: SiteService.GLOBAL_SITE,
                  onlyThisSite: false
              };
          }

          super(options);

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
      }

      /**
       * Overriding protected method of DAO to achieve site-aware query
       * @override
       * @protected
       * @method _doQuery
       * @param {Object} options
       * @param {Function} callback
       */
      _doQuery(options, callback) {
          var self = this;
          applySiteOperation(self, callback, function (site, opCallback) {
              var moddedOptions = modifyLoadOptions(site, options);
              DAO.prototype._doQuery.call(self, moddedOptions, opCallback);
          });
      }

      /**
       * Wrapper for site-aware DAO.save.  Saves object to database
       * @method save
       * @param {Object} dbObj
       * @param {Object} [options]
       * @param {Function} callback
       */
      save(dbObj, options, callback) {
          dbObj = modifySave(this.siteUid, dbObj);
          DAO.prototype.save.call(this, dbObj, options, callback);
      }

      /**
       * Gets all collection names
       * @method getCollections
       * @param {Function} cb
       */
      getCollections(cb) {
          this.listCollections({}, function (err, items) {
              if (_.isError(err)) {
                  log.error(err);
                  return cb(err);
              }

              items = items.filter(function (item) {
                  return item.name.indexOf('system.indexes') === -1 && item.name.indexOf('system.namespaces') === -1;
              });

              cb(err, items);
          });
      }
  }

    /**
     * @private
     * @static
     * @method modifyLoadWhere
     * @param {String} site
     * @param {Object} where
     * @return {Object}
     */
  function modifyLoadWhere(site, where) {
    if (Configuration.active.multisite.enabled) {
      where = _.clone(where);
      if (site === SiteService.GLOBAL_SITE) {
        var siteDoesNotExist = {}, siteEqualToSpecified = {};
        siteDoesNotExist[SiteService.SITE_FIELD] = {$exists: false};
        siteEqualToSpecified[SiteService.SITE_FIELD] = site;

        addToOr(where, [siteDoesNotExist, siteEqualToSpecified]);
      }
      else {
        where[SiteService.SITE_FIELD] = site;
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
    if (Configuration.active.multisite.enabled) {
      var target = _.clone(options);

      target.where = target.where || {};
      target.where = modifyLoadWhere(site, target.where);
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
            if (_.isError(err)) {
                return callback(err, cursor);
            }

            cursor.count(function (countError, count) {
                if (_.isError(countError)) {
                    callback(countError);
                }
                else if (count) {
                    callback(err, cursor);
                }
                else {
                    delegate(SiteService.GLOBAL_SITE, callback);
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
        return !siteUid || siteUid === SiteService.GLOBAL_SITE;
    }

    /**
     * @private
     * @method modifySave
     * @param {String} site
     * @param {Object} objectToSave
     * @return {Object} The object to save
     */
    function modifySave(site, objectToSave) {
        if (Configuration.active.multisite.enabled && !(SiteService.SITE_FIELD in objectToSave)) {
            objectToSave[SiteService.SITE_FIELD] = site;
        }
        // else do nothing
        return objectToSave;
    }

  module.exports = SiteQueryService;
