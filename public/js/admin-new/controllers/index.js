(function() {
  'use strict';

  angular.module('pencilblue.admin.app', [
    'ngRoute',
    'ngSanitize',
    'ngResource',
    'pencilblue.admin.elements.leftNav',
    'pencilblue.admin.elements.latestNews',
    'pencilblue.admin.elements.serverStatus'
  ])
  .controller('AdminIndexController', function() {

  });
}());
