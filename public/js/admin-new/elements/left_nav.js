(function() {
  'use strict';

  angular.module('pencilblue.admin.elements.leftNav', [])
  .controller('LeftNavController', function($scope, $http) {
    $scope.toggleItemExpansion = function(item) {
      item.expanded = !item.expanded;
    };

    $http.get('/api/content/navigation/map/admin')
    .success(function(result) {
      //$scope.navigationMap = result.data;
      $scope.navigationMap = JSON.parse(JSON.stringify(result.data).split('/admin').join('/admin-new'));
    })
    .error(function(error) {

    });
  });
}());
