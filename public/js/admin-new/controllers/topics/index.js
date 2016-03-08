(function() {
  'use strict';

  angular.module('pencilblue.admin.app', [
    'ngRoute',
    'ngSanitize',
    'ngResource',
    'pencilblue.admin.elements.leftNav',
    'pencilblue.admin.elements.pillNav',
    'pencilblue.admin.services.uid',
    'pencilblue.admin.factories.content.topics'
  ])
  .controller('AdminTopicsListController', function($scope, $rootScope, uidService, topicsFactory) {
    $rootScope.activeLeftNavItems = ['content', 'topics'];

    $scope.getTopics = function() {
      topicsFactory.getTopics(function(error, topics) {
        $scope.topics = topics;
      });
    };

    $scope.getTopicUid = function(topic) {
      return uidService.getUid(topic);
    };

    $scope.getTopics();
  });
}());
