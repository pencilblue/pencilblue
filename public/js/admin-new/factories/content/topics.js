(function() {
  'use strict';

  angular.module('pencilblue.admin.factories.content.topics', [
    'ngResource'
  ])
  .factory('topicsFactory', function($resource) {
    return {
      Topics: $resource('/api/content/topics', {}, {
        get: {
          method: 'GET',
          params: {
            q: '@q',
            $offset: '@$offset',
            $limit: '@$limit'
          }
        }
      }),

      getTopics: function(query, cb) {
        var topics = this.Topics.get(query, function() {
          cb(null, topics.data, topics.total);
        }, function(error) {
          cb(error);
        });
      }
    };
  });
}());
