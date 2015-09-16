(function() {
  angular.module('pencilblue.factories.admin.topics', [])
  .factory('topicFactory', function($http) {
    return {
      getTopics: function(options, cb) {
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

        $http.get('/api/content/topics' + queryString)
        .success(function(result) {
          cb(null, result.data, result.total);
        })
        .error(function(error) {
          cb(error);
        });
      },

      deleteTopic: function(id, cb) {
        $http({
          method: 'DELETE',
          url: '/api/content/topics/' + id
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
