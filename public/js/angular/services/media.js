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

        $http.post('/actions/admin/content/media' + (mediaObject._id ? '/' + mediaObject._id : ''), mediaObject, {
            headers: {'Content-Type': 'application/json'}
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
