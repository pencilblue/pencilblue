var async = require('async');
var util    = require('../util.js');

module.exports = function PluginRepositoryModule(pb) {

	var PLUGIN_COLL = 'plugin'
	var GLOBAL_PREFIX = 'global';
	var SITE_COLL = 'site';

	var publicAPI = {};

	publicAPI.loadPluginsWithThemesAvailableToThisSite = function(site, cb) {
		var dao = new pb.DAO();
		var hasATheme = getHasThemeQuery();
		var belongsToSite = getBelongsToSiteQuery(site);
		var belongsToGlobal = getBelongsToSiteQuery(GLOBAL_PREFIX);
		var siteWhere = {
			$and: [ hasATheme, belongsToSite ]
		};
		var globalWhere = {
			$and: [ hasATheme, belongsToGlobal ]
		};
		var tasks = {
			sitePlugins: function(callback) {
				dao.q(PLUGIN_COLL, siteWhere, callback);
			},
			globalPlugins: function(callback) {
				dao.q(PLUGIN_COLL, globalWhere, callback);
			}
		};
		async.parallel(tasks, function(err, results) {
			if(err) {
				cb(err, null);
			} else {
				var sitePlugins = results.sitePlugins || [];
				var globalPlugins = results.globalPlugins || [];
				var resultArray = mergeSitePluginsWithGlobalPlugins(sitePlugins, globalPlugins);
				cb(null, resultArray);
			}
		});
	};

	publicAPI.loadPluginsWithThemesOwnedByThisSite = function(site, cb) {
		var dao = new pb.DAO();
		var hasATheme = getHasThemeQuery();
		var belongsToSite = getBelongsToSiteQuery(site);
		var where = {
			$and: [ hasATheme, belongsToSite ]
		};
		dao.q(PLUGIN_COLL, where, cb);
	};

	publicAPI.loadPluginOwnedByThisSite = function(pluginID, site, cb) {
		var hasCorrectIdentifier = getCorrectIdQuery(pluginID);
        var belongsToThisSite = getBelongsToSiteQuery(site);

        var where = {
            $and: [ hasCorrectIdentifier, belongsToThisSite]
        };

        var dao = new pb.DAO();
        dao.loadByValues(where, PLUGIN_COLL, cb);
	};

	publicAPI.loadPluginAvailableToThisSite = function(pluginID, site, cb) {
		publicAPI.loadPluginOwnedByThisSite(pluginID, site, function(err, plugin){
            if (util.isError(err)) {
                cb(err, null);
                return;
            }

            if(!plugin) {
                if(site && site !== GLOBAL_PREFIX) {
                    publicAPI.loadPluginOwnedByThisSite(pluginID, GLOBAL_PREFIX, cb);
                    return;
                }
                cb(err, null);
            }

            cb(err, plugin);
        });
	};

	publicAPI.loadIncludedPluginsOwnedByThisSite = function(pluginIDs, site, cb) {
		if(!pluginIDs || !pluginIDs.length) {
			pluginIDs = [];
		}
		var idIsInTheList = getIdsInListQuery(pluginIDs);
		var belongsToThisSite = getBelongsToSiteQuery(site);
		var where = {
			$and: [idIsInTheList, belongsToThisSite]
		}
		var opts = {
            select: pb.DAO.SELECT_ALL,
            where: where,
            order: {created: pb.DAO.ASC}
        };
        var dao   = new pb.DAO();
        dao.q(PLUGIN_COLL, opts, cb);
	};

	publicAPI.loadPluginsNotIncludedOwnedByThisSite = function(pluginIDs, site, cb) {
		if(!pluginIDs || !pluginIDs.length) {
			pluginIDs = [];
		}
		var idIsNotInTheList = getIdsNotInListQuery(pluginIDs);
		var belongsToThisSite = getBelongsToSiteQuery(site);
		var where = {
			$and: [idIsNotInTheList, belongsToThisSite]
		}
		var opts = {
            select: pb.DAO.SELECT_ALL,
            where: where,
            order: {created: pb.DAO.ASC}
        };
        var dao   = new pb.DAO();
        dao.q(PLUGIN_COLL, opts, cb);
	};

	publicAPI.loadPluginsAcrossAllSites = function(cb) {
		var dao   = new pb.DAO();
        dao.q(PLUGIN_COLL, cb);
	};

	function getIdsNotInListQuery(pluginIDs) {
		var idIsInTheList = {uid: {'$nin': pluginIDs}};
		return idIsInTheList;
	}

	function getIdsInListQuery(pluginIDs) {
		var idIsInTheList = {uid: {'$in': pluginIDs}};
		return idIsInTheList;
	}

	function getHasThemeQuery() {
		var hasATheme = {theme: {$exists: true}};
		return hasATheme;
	}

	function getCorrectIdQuery(pluginID){
		var hasCorrectIdentifier = { $or: [
            {},
            {
                uid: pluginID
            }
        ]};
        hasCorrectIdentifier['$or'][0][pb.DAO.getIdField()] = pluginID;
        return hasCorrectIdentifier;
	}

	function getBelongsToSiteQuery(site) {
		var belongsToThisSite = {};
        if(!site || site === GLOBAL_PREFIX) {
            var hasNoSite = {};
            hasNoSite[SITE_COLL] = { $exists : false};

            var siteIsGlobal = {};
            siteIsGlobal[SITE_COLL] = GLOBAL_PREFIX;

            belongsToThisSite = { $or: [
                hasNoSite,
                siteIsGlobal
            ]};
        } else {
            belongsToThisSite = {};
            belongsToThisSite[SITE_COLL] = site;
        }
        return belongsToThisSite;
	}

	function mergeSitePluginsWithGlobalPlugins(sitePlugins, globalPlugins) {
		var resultArray = [].concat(sitePlugins);
		
		for( var j = 0; j < globalPlugins.length; j++) {
			var exists = false;
			for( var i = 0; i < sitePlugins.length; i++) {
				if(pluginsHaveSameID(globalPlugins[j], sitePlugins[i])) {
					exists = true;
				}
			}
			if(!exists) {
				resultArray.push(globalPlugins[j]);
			}
		}
		return resultArray;
	}

	function pluginsHaveSameID (pluginOne, pluginTwo) {
		var otherIDField = pb.DAO.getIdField();
		if(pluginOne.uid && pluginTwo.uid) {
			if(pluginOne.uid === pluginTwo.uid) {
				return true;
			}
		}
		if(pluginOne[otherIDField] && pluginTwo[otherIDField]) {
			if(pluginOne[otherIDField] === pluginTwo[otherIDField]) {
				return true;
			}
		}
		return false;
	}

	return publicAPI;
};