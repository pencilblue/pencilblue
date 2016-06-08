var url      = require('url');
var async    = require('async');
var util     = require('../util.js');

module.exports = function (pb) {

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
        pb.security.ACCESS_EDITOR,
        pb.security.ACCESS_WRITER,
        pb.security.ACCESS_USER
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
    function DBMigrate() {

        /**
         * @method run
         * @param {Function} cb
         */
        this.run = function (cb) {
            var self = this;
            var siteService = new pb.SiteService();
            siteService.getSiteMap(function (err, result) {
                if (util.isError(err)) {
                    return cb(err);
                }
                if (!pb.config.multisite.enabled || result.active.length > 0 || result.inactive.length > 0) {
                    return cb(null, true);
                }

                self.createSite(function (err, result) {
                    if (util.isError(err)) {
                        return cb(err);
                    }
                    self.siteUid = result.site.uid;
                    var tasks = [
                        util.wrapTask(self, self.migrateContentAndPluginData),
                        util.wrapTask(self, self.migrateSettings),
                        util.wrapTask(self, self.migrateUsers)
                    ];
                    async.series(tasks, cb);
                });
            });
        };

        /**
         * @method createSite
         * @param {Function} cb
         */
        this.createSite = function (cb) {
            var site = {
                displayName: pb.config.siteName,
                hostname: url.parse(pb.config.siteRoot).host
            };
            var siteService = new pb.SiteService();
            siteService.createSite(site, cb);
        };

        /**
         * @method migrateContentAndPluginData
         * @param {Function} cb
         */
        this.migrateContentAndPluginData = function(cb) {
            var self = this;
            var tasks = util.getTasks(MIGRATE_ALL, function (collections, i) {
                return function (callback) {
                    self.migrateCollection(collections[i], self.siteUid, callback);
                };
            });

            async.parallel(tasks, cb);
        };

        /**
         * @method migrateSettings
         * @param {Function} cb
         */
        this.migrateSettings = function (cb) {
            this.migrateGlobalSubCollection('setting', SITE_SPECIFIC_SETTINGS, 'key', cb);
        };

        /**
         * @method migrateUsers
         * @param {Function} cb
         */
        this.migrateUsers = function(cb) {
            this.migrateGlobalSubCollection('user', SITE_SPECIFIC_USERS, 'admin', cb);
        };

        /**
         * @method migrateGlobalSubCollection
         * @param {string} collection
         * @param {Array} siteSpecificArr
         * @param {*} compareTo
         * @param {Function} cb
         */
        this.migrateGlobalSubCollection = function(collection, siteSpecificArr, compareTo, cb) {
            var self = this;
            var dao = new pb.DAO();
            dao.q(collection, function(err, results) {
                var tasks = util.getTasks(results, function(results, i) {
                    return function(callback) {
                      var uid = siteSpecificArr.indexOf(results[i][compareTo]) > -1? self.siteUid : pb.SiteService.GLOBAL_SITE;
                      self.applySiteToDocument(results[i], uid, callback);
                    };
                });

                async.parallel(tasks, cb);
            });
        };

        /**
         * @method migrateCollection
         * @param {string} collection
         * @param {string} siteUid
         * @param {Function} cb
         */
        this.migrateCollection = function (collection, siteUid, cb) {
            var self = this;
            var dao = new pb.DAO();
            dao.q(collection, function (err, results) {
                var tasks = util.getTasks(results, function (results, i) {
                    return function (callback) {
                        self.applySiteToDocument(results[i], siteUid, callback);
                    };
                });

                async.parallel(tasks, cb);
            });
        };

        /**
         * @method applySiteToDocument
         * @param {object} document
         * @param {string} siteUid
         * @param {Function} callback
         */
        this.applySiteToDocument = function (document, siteUid, callback) {
            document[pb.SiteService.SITE_FIELD] = siteUid;
            var dao = new pb.DAO();
            dao.save(document, callback);
        };
    }
    return DBMigrate;

};
