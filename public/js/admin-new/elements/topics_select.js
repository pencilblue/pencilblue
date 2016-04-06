(function() {
  'use strict';

  angular.module('pencilblue.admin.elements.topicsSelect', [
    'pencilblue.services.search',
    'pencilblue.services.paginate',
    'pencilblue.admin.services.uid',
    'pencilblue.admin.factories.content.topics'
  ])
  .controller('TopicsSelectController', [
    '$scope',
    '$rootScope',
    '$timeout',
    'searchService',
    'paginationService',
    'uidService',
    'topicsFactory',
    function($scope, $rootScope, $timeout, searchService, paginationService, uidService, topicsFactory) {
      $scope.searchText = '';
      $scope.paginationPage = 0;
      $scope.paginationLimit = 100;
      $scope.pages = [];

      $scope.getTopics = function() {
        $scope.topics = null;
        topicsFactory.getTopics({q: $scope.searchText, $offset: $scope.paginationPage * $scope.paginationLimit, $limit: $scope.paginationLimit}, function(error, topics, total) {
          $scope.topics = topics;
          $scope.totalItems = total;
          $scope.pages = [];
          for(var i = 0; i < Math.ceil(total / $scope.paginationLimit); i++) {
            $scope.pages.push({});
          }

          $scope.syncTopics();
        });
      };

      $scope.getUid = function(topic) {
        return uidService.getUid(topic);
      };

      $scope.search = function() {
        $scope.paginationPage = 0;
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

      $scope.addTopic = function(index) {
        $rootScope.selectedTopics.push(angular.copy($scope.topics[index]));
        $scope.topics.splice(index, 1);
      };

      $scope.removeTopic = function(index) {
        $scope.topics.unshift(angular.copy($rootScope.selectedTopics[index]));
        $rootScope.selectedTopics.splice(index, 1);
      };

      $scope.syncTopics = function() {
        if(!$rootScope.selectedTopics || !$scope.topics) {
          $timeout($scope.syncTopics, 100);
          return;
        }

        for(var i = 0; i < $rootScope.selectedTopics.length; i++) {
          for(var j = 0; j < $scope.topics.length; j++) {
            if($scope.getUid($rootScope.selectedTopics[i]) === $scope.getUid($scope.topics[j])) {
              $scope.topics.splice(j, 1);
              break;
            }
          }
        }
      };

      var unregisterTopicsWatch = $rootScope.$watch('selectedTopics', function(newVal, oldVal) {
        if(newVal.length && typeof newVal[0] === 'string') {
          var fullTopics = [];
          var topicCount = 0;
          angular.forEach($rootScope.selectedTopics, function(topic) {
            topicsFactory.getTopic(topic, function(error, topic) {
              topicCount++;
              if(error) {
                return;
              }
              fullTopics.push(topic);
              if(topicCount === $rootScope.selectedTopics.length) {
                $rootScope.selectedTopics = fullTopics;
                $scope.syncTopics();
              }
            });
          });
        }
        if(newVal) {
          unregisterTopicsWatch();
        }
      });

      $scope.getTopics();
    }
  ]);
}());
