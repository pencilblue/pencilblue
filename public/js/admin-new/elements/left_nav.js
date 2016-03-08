(function() {
  'use strict';

  angular.module('pencilblue.admin.elements.leftNav', [])
  .controller('LeftNavController', function($scope, $http, $rootScope) {
    $scope.toggleItemExpansion = function(item) {
      item.expanded = !item.expanded;
    };

    $scope.activeItems = $rootScope.activeLeftNavItems || [];

    $http.get('/api/content/navigation/map/admin?activeItems=' + $scope.activeItems.join(','))
    .success(function(result) {
      //$scope.navigationMap = result.data;
      $scope.navigationMap = JSON.parse(JSON.stringify(result.data).split('/admin').join('/admin-new'));
      angular.forEach($scope.navigationMap, function(item) {
        item.expanded = item.active;
      });
    })
    .error(function(error) {

    });
  });
}());
