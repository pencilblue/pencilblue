(function() {
  angular.module('pencilblue.factories.admin.topics', [])
  .factory('topicFactory', function($http) {
    return {
      getTopics: function(limit, offset, cb) {
        $http.get('/api/content/topics?$limit=' + limit + '&$offset=' + offset)
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
