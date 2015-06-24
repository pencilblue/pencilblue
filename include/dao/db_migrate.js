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

    function DBMigrate(){}

    DBMigrate.run = function(cb) {
        var siteService = new pb.SiteService();
        siteService.getSiteMap(function(err, result) {
            if(pb.config.multisite && result.active.length === 0 && result.inactive.length === 0 ) {
                DBMigrate.createSite(function(err, isTaken, field, result) {
                    DBMigrate.migrateContentAndPluginData(result.uid, cb);//TODO: migrate content and plugin data to newly create site.
                });
            }
            else {
                cb(null, true);
            }
        });
    };

    DBMigrate.createSite = function(cb) {
        var siteService = new pb.SiteService();
        var site = pb.DocumentCreator.create('site', {
            displayName: pb.config.siteName,
            hostname: url.parse(pb.config.siteRoot).host
        });
        siteService.createSite(site, '', cb);
    };

    DBMigrate.migrateContentAndPluginData = function(siteUid, cb) {
        var tasks = pb.util.getTasks(MIGRATE_ALL, function(collections, i) {
            return function(callback) {
                DBMigrate.migrateCollection(collections[i], siteUid, callback);
            } ;
        });


        async.parallel(tasks, function(err, result) {
            cb(err, result);
        });
    };

    DBMigrate.migrateCollection = function(collection, siteUid, callback) {
        var dao = new pb.DAO();
        dao.q(collection, {}, function(err, results) {
            console.log(collection);
            console.log(results);
            var tasks = util.getTasks(results, function(results, i) {
                return function(callback) {
                    DBMigrate.applySiteToDocument(results[i], siteUid, callback);
                };
            });


            async.parallel(tasks, function(err, result) {
                callback(err, result);
            });
        });
    };

    DBMigrate.applySiteToDocument = function(document, siteUid, callback) {
        document.site = siteUid;
        var dao = new pb.DAO();
        dao.save(document, callback);
    };

    return DBMigrate;

};