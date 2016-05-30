(function() {
  'use strict';

  angular.module('pencilblue.admin.app', [
    'ngRoute',
    'ngSanitize',
    'ngResource',
    'pencilblue.admin.elements.leftNav',
    'pencilblue.admin.elements.pillNav',
    'pencilblue.admin.services.uid',
    'pencilblue.admin.directives.goBack',
    'pencilblue.admin.factories.users',
    'pencilblue.admin.factories.roles'
  ])
  .controller('AdminUsersFormController', function($scope, $rootScope, $window, uidService, usersFactory, rolesFactory) {
    $rootScope.activeLeftNavItems = ['content', 'users'];
    $rootScope.subNavKey = 'user_form';

    $scope.userId = userId.length ? userId : null;

    $scope.getUser = function() {
      if(!$scope.userId) {
        $scope.user = {};
        return;
      }

      usersFactory.getUser($scope.userId, function(error, user) {
        $scope.username = user.username;
        $scope.user = user;
        $scope.user.admin = $scope.user.admin.toString();
        rolesFactory.getRoles(function(error, roles) {
          $scope.roles = roles;
        });
      });
    };

    $scope.getUserUid = function(user) {
      return uidService.getUid(user);
    };

    $scope.saveUser = function() {
      $scope.formSubmitted = true;
      /*if(!$scope.userForm.$valid) {
        return;
      }*/

      $scope.saving = true;
      $scope.errorMessage = null;

      var userToSave = angular.copy($scope.user);
      userToSave.admin = parseInt(userToSave.admin, 10);
      usersFactory.saveUser(uidService.getUid($scope.user), userToSave, function(error, user) {
        $scope.saving = false;
        if(error) {
          $scope.errorMessage = error.message;
          return;
        }
        $scope.saveSuccess = true;

        if($scope.userId) {
          $scope.userName = $scope.user.name;
        }
        else {
          $window.location = '/admin-new/content/users/' + uidService.getUid(user);
        }
      });
    };

    $scope.$watch('user', function(newVal, oldVal) {
      if(newVal !== oldVal) {
        $scope.saveSuccess = false;
      }
    }, true);

    $scope.getUser();
  });
}());
