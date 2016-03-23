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
    $scope.paginationOffset = $location.search().offset || 0;
    $scope.paginationLimit = $location.search().limit || 100;
    $scope.pages = [];
    $scope.deleteNameKey = 'name';

    $scope.getTopics = function() {
      $scope.topics = null;
      topicsFactory.getTopics({q: $scope.searchText, $offset: $scope.paginationOffset, $limit: $scope.paginationLimit}, function(error, topics, total) {
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
      $scope.setLocationSearch();
      $scope.paginationOffset = 0;
      $scope.getTopics();
    };

    $scope.paginate = function(offset) {
      if(offset < 0) {
        offset = 0;
      }
      else if(offset >= $scope.pages.length) {
        offset = $scope.pages.length - 1;
      }

      if(offset === $scope.paginationOffset) {
        return;
      }

      $scope.paginationOffset = offset;
      $scope.getTopics();
    };

    $scope.setLocationSearch = function() {
      $location.search({
        q: $scope.searchText.length ? $scope.searchText : null,
        offset: $scope.paginationOffset,
        limit: $scope.paginationLimit
      });
    };

    $scope.getTopicInfo = function(topic) {
      for(var i = 0; i < $scope.topics.length; i++) {
        $scope.topics[i].infoActive = false;
      }
      topic.infoActive = true;
    };

    $scope.getTopics();
  });
}());
