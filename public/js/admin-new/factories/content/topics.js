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
        get: {
          method: 'GET',
          params: {
            id: '@id'
          }
        },
        save: {
          method: 'PUT',
          params: {
            id: '@id'
          }
        },
        saveNew: {
          method: 'POST'
        },
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

      getTopic: function(id, cb) {
        var topic = this.Topic.get({id: id}, function() {
          cb(null, topic);
        }, function(error) {
          cb(error);
        });
      },

      saveTopic: function(id, topic, cb) {
        if(!id) {
          this.saveNewTopic(topic, cb);
          return;
        }

        this.Topic.save({id: id}, topic, function() {
          cb(null);
        }, function(error) {
          cb(error);
        });
      },

      saveNewTopic: function(topic, cb) {
        var topic = this.Topic.saveNew({}, topic, function() {
          cb(null, topic);
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
