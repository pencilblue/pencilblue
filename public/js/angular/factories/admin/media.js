(function() {
  angular.module('pencilblue.factories.admin.media', [])
  .factory('mediaFactory', function($http) {
    return {
      getMedia: function(options, cb) {
        var queryString = '';
        for(var key in options) {
          if(queryString.length) {
            queryString += '&';
          }
          else {
            queryString += '?';
          }

          queryString += key + '=' + options[key];
        }

        $http.get('/api/content/media' + queryString)
        .success(function(result) {
          cb(null, result.data, result.total);
        })
        .error(function(error) {
          cb(error);
        });
      },

      deleteMedia: function(id, cb) {
        $http({
          method: 'DELETE',
          url: '/api/content/media/' + id
        })
        .success(function(result) {
          cb(null, result);
        })
        .error(function(error) {
          cb(error);
        });
      }
    };
  });
}());
