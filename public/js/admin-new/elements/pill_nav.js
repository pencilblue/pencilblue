(function() {
  'use strict';

  angular.module('pencilblue.admin.elements.pillNav', [])
  .controller('PillNavController', function($scope, $http, $rootScope, $timeout) {
    var pillNavTimeout;

    $scope.getPillNavItems = function() {
      $http.get('/api/content/navigation/map/adminsubnav?key=' + $rootScope.subNavKey)
      .success(function(result) {
        result.data = result.data || [];

        for(var i = 0; i < result.data.length; i++) {
          result.data[i].href = result.data[i].href.split('/admin').join('/admin-new');
        }
        $scope.pillNavItems = result.data;
      })
      .error(function(error, status) {

      });
    };

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
      }, 2000);
    };

    $scope.getPillNavItems();
  });
}());
