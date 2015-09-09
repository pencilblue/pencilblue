(function() {
  angular.module('pencilblue.factories.admin.topics', [])
  .factory('topicFactory', function($http) {
    return {
      getTopics: function(cb) {
        $http.get('/api/admin/content/topics')
        .success(function(result) {
          cb(null, result.data);
        })
        .error(function(error) {
          cb(error);
        });
      },

      deleteTopic: function(id, cb) {
        $http({
          method: 'DELETE',
          url: '/api/admin/content/topics/' + id
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
