(function() {
  'use strict';

  angular.module('pencilblue.admin.app', [
    'ngRoute',
    'ngSanitize',
    'ngResource',
    'pencilblue.services.search',
    'pencilblue.services.paginate',
    'pencilblue.admin.elements.leftNav',
    'pencilblue.admin.elements.pillNav',
    'pencilblue.admin.services.uid',
    'pencilblue.admin.factories.users',
    'pencilblue.admin.factories.content.articles'
  ])
  .controller('AdminUsersListController', function($scope, $rootScope, $location, searchService, paginationService, uidService, usersFactory, articlesFactory) {
    $rootScope.activeLeftNavItems = ['users', 'manage'];
    $rootScope.subNavKey = 'manage_users';

    $scope.searchText = $location.search().q || '';
    $scope.paginationPage = parseInt($location.search().page) || 0;
    $scope.paginationLimit = parseInt($location.search().limit) || 12;
    $scope.pages = [];

    $scope.getUsers = function() {
      $scope.users = null;
      usersFactory.getUsers({q: $scope.searchText, $offset: $scope.paginationPage * $scope.paginationLimit, $limit: $scope.paginationLimit}, function(error, users, total) {
        $scope.users = users;
        $scope.totalItems = total;
        $scope.pages = [];
        for(var i = 0; i < Math.ceil(total / $scope.paginationLimit); i++) {
          $scope.pages.push({});
        }
        $scope.setLocationSearch();
      });
    };

    $scope.getUid = function(item) {
      return uidService.getUid(item);
    };

    $scope.search = function() {
      $scope.paginationPage = 0;
      $scope.setLocationSearch();
      $scope.getUsers();
    };

    $scope.paginate = function(offset) {
      if(offset < 0) {
        offset = 0;
      }
      else if(offset >= $scope.pages.length) {
        offset = $scope.pages.length - 1;
      }

      if(offset === $scope.paginationPage) {
        return;
      }

      $scope.paginationPage = offset;
      $scope.getUsers();
    };

    $scope.setLocationSearch = function() {
      $location.search({
        q: $scope.searchText.length ? $scope.searchText : null,
        page: $scope.paginationPage,
        limit: $scope.paginationLimit
      });
    };

    $scope.getUserInfo = function(user) {
      for(var i = 0; i < $scope.users.length; i++) {
        $scope.users[i].infoActive = false;
      }
      user.infoActive = true;
    };

    $scope.confirmDeletion = function(user) {
      $scope.objectToDelete = user;
      $scope.deletionNameKey = 'name';
      angular.element('.deletion-modal').modal('show');
    };

    $scope.getUserInfo = function(user) {
      for(var i = 0; i < $scope.users.length; i++) {
        $scope.users[i].infoActive = false;
      }
      user.infoActive = true;
      $scope.contextUser = user;

      /*$scope.contextUser.rendered_topics = [];
      angular.forEach($scope.contextUser.user_topics, function(topic) {
        topicsFactory.getTopic(topic, function(error, topic) {
          if(error) {
            return;
          }

          $scope.contextUser.rendered_topics.push(topic);
        });
      });*/
    };

    $scope.deleteObject = function() {
      if(!$scope.objectToDelete) {
        return;
      }

      $scope.deleting = true;
      usersFactory.deleteUser($scope.getUid($scope.objectToDelete), function(error, result) {
        if(error) {
          $scope.deleting = false;
          $scope.errorMessage = error.message;
          angular.element('.deletion-modal').modal('hide');
          return;
        }

        angular.element('.deletion-modal').modal('hide');
        $scope.paginationPage = 0;
        $scope.setLocationSearch();
        $scope.getUsers();
      });
    };

    $scope.getUsers();
  });
}());
