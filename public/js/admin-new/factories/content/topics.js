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

      Topic: $resource('/api/content/topics/:id', {id: '@id'}, {
        delete: {
          method: 'DELETE',
          params: {
            id: '@id'
          }
        }
      }),

      getTopics: function(query, cb) {
        var topics = this.Topics.get(query, function() {
          cb(null, topics.data, topics.total);
        }, function(error) {
          cb(error);
        });
      },

      deleteTopic: function(id, cb) {
        this.Topic.delete({id: id}, function() {
          cb(null);
        }, function(error) {
          cb(error);
        });
      }
    };
  });
}());
