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

    this.saveMedia = function(mediaObject) {
        var deferred = $q.defer();
        var formData = $.param(mediaObject);

        $http.post('/actions/admin/content/media', formData, {
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
