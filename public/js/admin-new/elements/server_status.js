(function() {
  'use strict';

  angular.module('pencilblue.admin.elements.serverStatus', [])
  .controller('ServerStatusController', function($scope, $http, $timeout, $interval) {
    $scope.updateClusterStats = function() {
      $http.get('/api/cluster')
      .success(function(result) {
        $scope.cluster = result;
        $timeout($scope.updateClusterStats, 10000);
        $timeout($scope.addTooltips, 1000);
      });
    };

    $scope.addTooltips = function() {
      angular.element('.has-tooltip').tooltip();
    };

    $scope.incrementUptime = function() {
      for(var i = 0; i < $scope.cluster.length; i++) {
        $scope.cluster[i].uptime++;
      }
    }

    $scope.getNodeIcon = function(node) {
      if(node.ip.indexOf('192.168') > -1 || node.ip.indexOf('127.0.0.1') > -1 || node.ip.indexOf('localhost') > -1) {
        return 'fa-laptop';
      }

      if(node.is_master) {
        return 'fa-cloud-download';
      }
      else {
        return 'fa-cloud';
      }
    };

    $scope.getNodeMemoryPercentage = function(node) {
      return Math.floor((node.mem_usage.heapUsed / node.mem_usage.heapTotal) * 100) + '%';
    };

    $scope.getFormattedUptime = function(seconds) {
      seconds = Math.floor(seconds);
      var minutes = 0;
      var hours = 0;

      while(seconds > 60 * 60) {
        seconds -= 60 * 60;
        hours++;
      }
      while(seconds > 60) {
        seconds -= 60;
        minutes++;
      }

      if(seconds < 10) {
        seconds = '0' + seconds;
      }
      if(minutes < 10) {
        minutes = '0' + minutes;
      }

      return hours + ':' + minutes + ':' + seconds;
    };

    $scope.updateClusterStats();
    $interval($scope.incrementUptime, 1000);
  });
}());
