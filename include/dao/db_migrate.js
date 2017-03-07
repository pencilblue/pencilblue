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

const _ = require('lodash');
const async = require('async');
const Configuration = require('../config');
const SecurityService = require('../access_management');
const SiteUtils = require('../../lib/utils/siteUtils');
const TaskUtils = require('../../lib/utils/taskUtils');
const url = require('url');

/**
 * Array of collections used to append a "site" value to all documents
 * @private
 * @static
 * @readonly
 * @property MIGRATE_ALL
 * @type {Array}
 */
var MIGRATE_ALL = [
    'article',
    'comment',
    'custom_object_type',
    'custom_object',
    'media',
    'page',
    'plugin',
    'plugin_settings',
    'section',
    'theme_settings',
    'topic'
];

/**
 * Array of security levels that will access admin console on a site level.
 * @private
 * @static
 * @readonly
 * @property SITE_SPECIFIC_USERS
 * @type {Array}
 */
var SITE_SPECIFIC_USERS = [
    SecurityService.ACCESS_EDITOR,
    SecurityService.ACCESS_WRITER,
    SecurityService.ACCESS_USER
];

/**
 * Site Settings that will migrate to a site level from global.
 * @private
 * @static
 * @readonly
 * @property SITE_SPECIFIC_SETTINGS
 * @type {Array}
 */
var SITE_SPECIFIC_SETTINGS = [
    'active_theme',
    'content_settings',
    'section_map',
    'email_settings'
];

/**
 * On run, transforms a single tenant instance to a multi-tenant instance where the site defined
 * in the single tenant instance becomes a site under global's scope.
 * @class DBMigrate
 * @constructor
 */
class DBMigrate {
    constructor (context) {

        //this.siteService = new SiteService({
        //    site: SiteUtils.GLOBAL_SITE,
        //    onlyThisSite: false
        //});

        this.dao = context.dao;

        this.siteService = context.siteService;
    }

    /**
     * @method run
     * @param {Function} cb
     */
    run  (cb) {
        var self = this;
        this.siteService.getSiteMap(function (err, result) {
            if (_.isError(err)) {
                return cb(err);
            }
            if (!Configuration.active.multisite.enabled || result.active.length > 0 || result.inactive.length > 0) {
                return cb(null, true);
            }

            self.createSite(function (err, result) {
                if (_.isError(err)) {
                    return cb(err);
                }
                self.siteUid = result.site.uid;
                var tasks = [
                    TaskUtils.wrapTask(self, self.migrateContentAndPluginData),
                    TaskUtils.wrapTask(self, self.migrateSettings),
                    TaskUtils.wrapTask(self, self.migrateUsers)
                ];
                async.series(tasks, cb);
            });
        });
    }

    /**
     * @method createSite
     * @param {Function} cb
     */
    createSite  (cb) {
        var site = {
            displayName: Configuration.active.siteName,
            hostname: url.parse(Configuration.active.siteRoot).host
        };
        this.siteService.createSite(site, cb);
    }

    /**
     * @method migrateContentAndPluginData
     * @param {Function} cb
     */
    migrateContentAndPluginData (cb) {
        var self = this;
        var tasks = MIGRATE_ALL.map(function (collection) {
            return function (callback) {
                self.migrateCollection(collection, self.siteUid, callback);
            };
        });

        async.parallel(tasks, cb);
    }

    /**
     * @method migrateSettings
     * @param {Function} cb
     */
    migrateSettings  (cb) {
        this.migrateGlobalSubCollection('setting', SITE_SPECIFIC_SETTINGS, 'key', cb);
    }

    /**
     * @method migrateUsers
     * @param {Function} cb
     */
    migrateUsers (cb) {
        this.migrateGlobalSubCollection('user', SITE_SPECIFIC_USERS, 'admin', cb);
    }

    /**
     * @method migrateGlobalSubCollection
     * @param {string} collection
     * @param {Array} siteSpecificArr
     * @param {*} compareTo
     * @param {Function} cb
     */
    migrateGlobalSubCollection (collection, siteSpecificArr, compareTo, cb) {
        var self = this;
        this.dao.q(collection, function(err, results) {
            var tasks = results.map(function(result, i, results) {
                return function(callback) {
                  var uid = siteSpecificArr.indexOf(results[i][compareTo]) > -1? self.siteUid : SiteUtils.GLOBAL_SITE;
                  self.applySiteToDocument(results[i], uid, callback);
                };
            });

            async.parallel(tasks, cb);
        });
    }

    /**
     * @method migrateCollection
     * @param {string} collection
     * @param {string} siteUid
     * @param {Function} cb
     */
    migrateCollection  (collection, siteUid, cb) {
        var self = this;
        this.dao.q(collection, function (err, results) {
            var tasks = results.map(function (result) {
                return function (callback) {
                    self.applySiteToDocument(result, siteUid, callback);
                };
            });

            async.parallel(tasks, cb);
        });
    }

    /**
     * @method applySiteToDocument
     * @param {object} document
     * @param {string} siteUid
     * @param {Function} callback
     */
    applySiteToDocument  (document, siteUid, callback) {
        document[SiteUtils.SITE_FIELD] = siteUid;
        this.dao.save(document, callback);
    }
}

module.exports = DBMigrate;
