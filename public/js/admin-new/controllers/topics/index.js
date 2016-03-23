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
    'pencilblue.admin.factories.content.topics'
  ])
  .controller('AdminTopicsListController', function($scope, $rootScope, $location, searchService, paginationService, uidService, topicsFactory) {
    $rootScope.activeLeftNavItems = ['content', 'topics'];
    $rootScope.subNavKey = 'manage_topics';

    $scope.searchText = $location.search().q || '';
    $scope.paginationPage = parseInt($location.search().page) || 0;
    $scope.paginationLimit = parseInt($location.search().limit) || 100;
    $scope.pages = [];
    $scope.deleteNameKey = 'name';

    $scope.getTopics = function() {
      $scope.topics = null;
      topicsFactory.getTopics({q: $scope.searchText, $offset: $scope.paginationPage * $scope.paginationLimit, $limit: $scope.paginationLimit}, function(error, topics, total) {
        $scope.topics = topics;
        $scope.totalItems = total;
        $scope.pages = [];
        for(var i = 0; i < Math.ceil(total / $scope.paginationLimit); i++) {
          $scope.pages.push({});
        }
        $scope.setLocationSearch();
      });
    };

    $scope.getTopicUid = function(topic) {
      return uidService.getUid(topic);
    };

    $scope.search = function() {
      $scope.paginationPage = 0;
      $scope.setLocationSearch();
      $scope.getTopics();
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
      $scope.getTopics();
    };

    $scope.setLocationSearch = function() {
      $location.search({
        q: $scope.searchText.length ? $scope.searchText : null,
        page: $scope.paginationPage,
        limit: $scope.paginationLimit
      });
    };

    $scope.getTopicInfo = function(topic) {
      for(var i = 0; i < $scope.topics.length; i++) {
        $scope.topics[i].infoActive = false;
      }
      topic.infoActive = true;
    };

    $scope.confirmDeletion = function(topic) {
      $scope.objectToDelete = topic;
      $scope.deletionNameKey = 'name';
      angular.element('.deletion-modal').modal('show');
    };

    $scope.deleteObject = function() {
      if(!$scope.objectToDelete) {
        return;
      }

      $scope.deleting = true;
      topicsFactory.deleteTopic($scope.objectToDelete._id || $scope.objectToDelete.id, function(error, result) {
        if(error) {
          $scope.deleting = false;
          $scope.errorMessage = error.message;
          angular.element('.deletion-modal').modal('hide');
          return;
        }

        angular.element('.deletion-modal').modal('hide');
        $scope.paginationPage = 0;
        $scope.setLocationSearch();
        $scope.getTopics();
      });
    };

    $scope.getTopics();
  });
}());
