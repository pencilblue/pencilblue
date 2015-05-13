angular.module('media', [])
.service('mediaService', function($http, $q) {
    this.loadMediaLink = function(url, cb) {
        $http.get('/api/admin/content/media/get_link?url=' + url)
        .success(function(result) {
            cb(null, result);
        })
        .error(function(error, status) {
            error.status = status;
            cb(error);
        });
    };

    this.getMediaPreview = function(type, location, cb) {
        $http.get('/api/admin/content/media/get_preview?type=' + type + '&location=' + location)
        .success(function(result) {
            cb(null, result);
        })
        .error(function(error, status) {
            error.status = status;
            cb(error);
        });
    };

    this.saveMedia = function(mediaObject, sitePrefix) {
        var deferred = $q.defer();
        var actionPrefix = '/actions/admin';
        if(sitePrefix) {
            actionPrefix += sitePrefix;
        }
        $http.post(actionPrefix + '/content/media' + (mediaObject._id ? '/' + mediaObject._id : ''), mediaObject, {
            headers: {'Content-Type': 'application/x-www-form-urlencoded'}
        })
        .success(function(result) {
            deferred.resolve(result);
        })
        .error(function(error, status) {
            deferred.reject(error, status);
        });

        return deferred.promise;
    };
});
