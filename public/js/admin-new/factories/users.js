(function() {
  'use strict';

  angular.module('pencilblue.admin.factories.users', [
    'ngResource'
  ])
  .factory('usersFactory', function($resource) {
    return {
      Users: $resource('/api/users', {}, {
        get: {
          method: 'GET',
          params: {
            q: '@q',
            role: '@role',
            $offset: '@$offset',
            $limit: '@$limit',
            render: '@render'
          }
        }
      }),

      User: $resource('/api/users/:id', {id: '@id'}, {
        get: {
          method: 'GET',
          params: {
            id: '@id',
            render: '@render'
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

      getUsers: function(query, cb) {
        var users = this.Users.get(query, function() {
          cb(null, users.data, users.total);
        }, function(error) {
          cb(error);
        });
      },

      getUser: function(id, cb) {
        var user = this.User.get({id: id}, function() {
          cb(null, user);
        }, function(error) {
          cb(error);
        });
      },

      getMe: function(id, cb) {
        var user = this.User.get({id: 'me'}, function() {
          cb(null, user);
        }, function(error) {
          cb(error);
        });
      },

      saveUser: function(id, user, cb) {
        if(!id) {
          this.saveNewUser(user, cb);
          return;
        }

        this.User.save({id: id}, user, function() {
          cb(null);
        }, function(error) {
          cb(error);
        });
      },

      saveNewUser: function(user, cb) {
        var user = this.User.saveNew({}, user, function() {
          cb(null, user);
        }, function(error) {
          cb(error);
        });
      },

      deleteUser: function(id, cb) {
        this.User.delete({id: id}, function() {
          cb(null);
        }, function(error) {
          cb(error);
        });
      }
    };
  });
}());
