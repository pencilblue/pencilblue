var url      = require('url');
var async    = require('async');
var util     = require('../util.js');

module.exports = function DBMigrateModule(pb) {
    /**
     * Array of collections used to append a "site" value to all documents
     * @private
     * @static
     * @readonly
     * @property MIGRATE_ALL
     * @type {string[]}
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
     * @type {string[]}
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
     * @type {string[]}
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
     * @constructor DBMigrate
     */
    function DBMigrate() {

        this.run = function (cb) {
            var self = this;
            var siteService = new pb.SiteService();
            siteService.getSiteMap(function (err, result) {
                if (!pb.config.multisite.enabled || result.active.length > 0 || result.inactive.length > 0) {
                    return cb(null, true);
                }

                self.createSite(function (err, isTaken, field, result) {
                    self.siteUid = result.uid;
                    var tasks = [
                        util.wrapTask(self, self.migrateContentAndPluginData),
                        util.wrapTask(self, self.migrateSettings),
                        util.wrapTask(self, self.migrateUsers)
                    ];
                    async.series(tasks, cb);
                });
            });
        };

        this.createSite = function (cb) {
            var siteService = new pb.SiteService();
            var site = pb.DocumentCreator.create('site', {
                displayName: pb.config.siteName,
                hostname: url.parse(pb.config.siteRoot).host
            });
            siteService.createSite(site, '', cb);
        };

        this.migrateContentAndPluginData = function(cb) {
            var self = this;
            var tasks = util.getTasks(MIGRATE_ALL, function (collections, i) {
                return function (callback) {
                    self.migrateCollection(collections[i], self.siteUid, callback);
                };
            });

            async.parallel(tasks, cb);
        };

        this.migrateSettings = function (cb) {
            this.migrateGlobalSubCollection('setting', SITE_SPECIFIC_SETTINGS, 'key', cb);
        };

        this.migrateUsers = function(cb) {
            this.migrateGlobalSubCollection('user', SITE_SPECIFIC_USERS, 'admin', cb);
        };

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

        this.applySiteToDocument = function (document, siteUid, callback) {
            document[pb.SiteService.SITE_FIELD] = siteUid;
            var dao = new pb.DAO();
            dao.save(document, callback);
        };
    }
    return DBMigrate;

};