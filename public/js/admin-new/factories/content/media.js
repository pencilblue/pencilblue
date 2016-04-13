(function() {
  'use strict';

  angular.module('pencilblue.admin.factories.content.media', [
    'ngResource'
  ])
  .factory('mediaFactory', function($resource) {
    return {
      MultipleMedia: $resource('/api/content/media', {}, {
        get: {
          method: 'GET',
          params: {
            q: '@q',
            $offset: '@$offset',
            $limit: '@$limit'
          }
        }
      }),

      Media: $resource('/api/content/media/:id', {id: '@id'}, {
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
        },
        getLocation: {
          method: 'GET',
          url: '/api/admin/content/media/get_link',
          params: {
            url: '@url'
          }
        }
      }),

      getMultipleMedia: function(query, cb) {
        var media = this.MultipleMedia.get(query, function() {
          cb(null, media.data, media.total);
        }, function(error) {
          cb(error);
        });
      },

      getMedia: function(id, cb) {
        var media = this.Media.get({id: id}, function() {
          cb(null, media);
        }, function(error) {
          cb(error);
        });
      },

      saveMedia: function(id, media, cb) {
        if(!id) {
          this.saveNewMedia(media, cb);
          return;
        }

        this.Media.save({id: id}, media, function() {
          cb(null);
        }, function(error) {
          cb(error);
        });
      },

      saveNewMedia: function(media, cb) {
        var media = this.Media.saveNew({}, media, function() {
          cb(null, media);
        }, function(error) {
          cb(error);
        });
      },

      deleteMedia: function(id, cb) {
        this.Media.delete({id: id}, function() {
          cb(null);
        }, function(error) {
          cb(error);
        });
      },

      getMediaLocation: function(url, cb) {
        var media = this.Media.getLocation({url: url}, function() {
          cb(null, media.data.location);
        }, function(error) {
          cb(error.data);
        });
      }
    };
  });
}());
