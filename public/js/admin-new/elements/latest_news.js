(function() {
  'use strict';

  angular.module('pencilblue.admin.elements.latestNews', [])
  .controller('LatestNewsController', function($scope, $http, $sce) {
    $scope.newsCopy = '';

		$scope.getNewsCopyHtml = function() {
			return $sce.trustAsHtml($scope.newsCopy);
		};

    $scope.cleanNewsCopy = function(copy) {
			copy = copy.split('<![CDATA[').join('').split(']]>').join('');

			while(copy.indexOf('^media_display_') > -1) {
				var index = copy.indexOf('^media_display_');
				var endIndex = copy.substr(index + 1).indexOf('^');
				copy = copy.split(copy.substr(index, endIndex + 2)).join('');
			}

			return copy;
		};

    $http.get('https://pencilblue.org/feed')
		.success(function(result) {
      var parser;
      var feed;

			if(window.DOMParser){
				parser = new DOMParser();
				feed = parser.parseFromString(result, 'text/xml');
			}
			else {
				feed = new ActiveXObject('Microsoft.XMLDOM');
				feed.async = false;
				feed.loadXML(result);
			}

			var item = $(feed).find('rss').find('item');
			item = $(item[0]);

			$scope.newsTitle = item.find('title').text();
			$scope.newsLink = item.find('link').text();

			var copy = item.find('encoded');
			if(copy.length === 0) {
				copy = item.find('content\\:encoded');
			}

			$scope.newsCopy = $scope.cleanNewsCopy(copy.text());
		});
  });
}());
