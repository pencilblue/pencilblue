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

    var MIGRATE_SPECIFIC = [
        'user',
        'setting'
    ];

    var GLOBAL_USERS = [
        pb.security.ACCESS_ADMINISTRATOR,
        pb.security.ACCESS_MANAGING_EDITOR
    ];

    var SITE_SPECIFIC_SETTINGS = [
        'active_theme',
        'content_settings',
        'section_map',
        'email_settings'
    ];

    function DBMigrate() {

        this.run = function (cb) {
            var self = this;
            var siteService = new pb.SiteService();
            siteService.getSiteMap(function (err, result) {
                if (pb.config.multisite && result.active.length === 0 && result.inactive.length === 0) {
                    self.createSite(function (err, isTaken, field, result) {
                        self.siteUid = result.uid;
                        var tasks = [
                            util.wrapTask(self, self.migrateContentAndPluginData),
                            util.wrapTask(self, self.migrateSettings)
                        ];
                        //self.migrateContentAndPluginData(cb);
                        async.series(tasks, function(err, result) {
                           cb(null, true);
                        });
                    });
                }
                else {
                    cb(null, true);
                }
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
            var tasks = pb.util.getTasks(MIGRATE_ALL, function (collections, i) {
                return function (callback) {
                    self.migrateCollection(collections[i], self.siteUid, callback);
                };
            });


            async.parallel(tasks, function (err, result) {
                cb(err, result);
            });
        };

        this.migrateSettings = function (cb) {
            var self = this;
            var dao = new pb.DAO();
            dao.q('setting', {}, function(err, results) {
                var tasks = util.getTasks(results, function(results, i) {
                   return function(callback) {
                       if(SITE_SPECIFIC_SETTINGS.indexOf(results[i].key) > -1) {
                           self.applySiteToDocument(results[i], self.siteUid, callback);
                       }
                       else {
                           callback(null, true);
                       }
                   }
                });
                async.parallel(tasks, function(err, result) {
                    cb(null, true);
                });
            });
        };

        this.migrateCollection = function (collection, siteUid, callback) {
            var self = this;
            var dao = new pb.DAO();
            dao.q(collection, {}, function (err, results) {
                var tasks = util.getTasks(results, function (results, i) {
                    return function (callback) {
                        self.applySiteToDocument(results[i], siteUid, callback);
                    };
                });


                async.parallel(tasks, function (err, result) {
                    callback(err, result);
                });
            });
        };

        this.applySiteToDocument = function (document, siteUid, callback) {
            document.site = siteUid;
            var dao = new pb.DAO();
            dao.save(document, callback);
        };
    }
    return DBMigrate;

};