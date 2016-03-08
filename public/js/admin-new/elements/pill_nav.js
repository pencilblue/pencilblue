(function() {
  'use strict';

  angular.module('pencilblue.admin.elements.pillNav', [])
  .controller('PillNavController', function($scope, $http, $rootScope, $timeout) {
    var pillNavTimeout;

    $scope.showMinorPillNav = function() {
      $scope.minorPillNavOn = true;
      if(pillNavTimeout) {
        $timeout.cancel(pillNavTimeout);
      }
    };

    $scope.hideMinorPillNav = function() {
      pillNavTimeout = $timeout(function() {
        if(!$scope.mouseOverPillNav) {
          $scope.minorPillNavOn = false;
        }
      }, 2000)
    };
  });
}());
