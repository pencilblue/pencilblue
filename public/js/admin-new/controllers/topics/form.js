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
    'pencilblue.admin.factories.content.topics'
  ])
  .controller('AdminTopicsFormController', function($scope, $rootScope, $window, uidService, topicsFactory) {
    $rootScope.activeLeftNavItems = ['content', 'topics'];
    $rootScope.subNavKey = 'topic_form';

    $scope.topicId = topicId.length ? topicId : null;

    $scope.getTopic = function() {
      if(!$scope.topicId) {
        $scope.topic = {};
        return;
      }

      topicsFactory.getTopic($scope.topicId, function(error, topic) {
        $scope.topicName = topic.name;
        $scope.topic = topic;
      });
    };

    $scope.getTopicUid = function(topic) {
      return uidService.getUid(topic);
    };

    $scope.saveTopic = function() {
      $scope.formSubmitted = true;
      /*if(!$scope.topicForm.$valid) {
        return;
      }*/

      $scope.saving = true;
      $scope.errorMessage = null;
      topicsFactory.saveTopic(uidService.getUid($scope.topic), $scope.topic, function(error, topic) {
        $scope.saving = false;
        if(error) {
          $scope.errorMessage = error.message;
          return;
        }
        $scope.saveSuccess = true;

        if($scope.topicId) {
          $scope.topicName = $scope.topic.name;
        }
        else {
          $window.location = '/admin-new/content/topics/' + uidService.getUid(topic);
        }
      });
    };

    $scope.$watch('topic', function(newVal, oldVal) {
      if(newVal !== oldVal) {
        $scope.saveSuccess = false;
      }
    }, true);

    $scope.getTopic();
  });
}());
