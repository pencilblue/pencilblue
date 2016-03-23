(function() {
  'use strict';

  angular.module('pencilblue.admin.directives.goBack', [])
  .directive('goBack', function($window) {
    return {
      restrict: 'A',
      link: function(scope, elem, attrs) {
        elem.on('click', function(event) {
          $window.history.back();
        });
      }
    };
  });
}());
