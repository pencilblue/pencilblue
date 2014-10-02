angular.module('media', [])
.service('mediaService', function($http) {
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
});
