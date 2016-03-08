(function() {
  'use strict';

  angular.module('pencilblue.admin.factories.content.topics', [
    'ngResource'
  ])
  .factory('topicsFactory', function($resource) {
    return {
      Topics: $resource('/api/content/topics', {}, {
        get: {
          method: 'GET'
        }
      }),

      getTopics: function(cb) {
        var topics = this.Topics.get(function() {
          cb(null, topics.data);
        }, function(error) {
          cb(error);
        });
      }
    }
  });
}());
