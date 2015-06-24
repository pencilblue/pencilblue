var url      = require('url');
var async    = require('async');
var util     = require('../util.js');

module.exports = function DBMigrateModule(pb) {
    /**
     * Array of collections used to append a "site" value to documents
     * @private
     * @static
     * @readonly
     * @property MIGRATE_COLL
     * @type {string[]}
     */
    var MIGRATE_COLL = [
        'article',
        'comment',
        'custom_object_type',
        'media',
        'page',
        'plugin',
        'plugin_settings',
        'section',
        'setting',
        'theme_settings',
        'topic',
        'user'
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
                    cb(null, true);//TODO: migrate content and plugin data to newly create site.
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


    return DBMigrate;

};