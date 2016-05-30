(function() {
  'use strict';

  angular.module('pencilblue.admin.factories.roles', [
    'ngResource'
  ])
  .factory('rolesFactory', function($resource) {
    return {
      Roles: $resource('/api/roles', {}, {
        get: {
          method: 'GET'
        }
      }),

      getRoles: function(cb) {
        var self = this;
        var roles = this.Roles.get(function() {
          for(var i = 0; i < roles.data.length; i++) {
            roles.data[i].name = self.getRoleName(roles.data[i]);
          }
          cb(null, roles.data, roles.total);
        }, function(error) {
          cb(error);
        });
      },

      getRoleName: function(role) {
        var locElements = role.localizationKey.split('.');
        var name = angular.copy(loc);

        while(locElements.length) {
          name = name[locElements[0]];
          locElements.splice(0, 1);
        }

        return name || '';
      }
    };
  });
}());
