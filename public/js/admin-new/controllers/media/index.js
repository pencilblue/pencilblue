(function() {
  'use strict';

  angular.module('pencilblue.admin.app', [
    'ngRoute',
    'ngSanitize',
    'ngResource',
    'pencilblue.services.search',
    'pencilblue.services.paginate',
    'pencilblue.admin.elements.leftNav',
    'pencilblue.admin.elements.pillNav',
    'pencilblue.admin.services.uid',
    'pencilblue.admin.services.preview',
    'pencilblue.admin.factories.content.media'
  ])
  .controller('AdminMediaListController', function($scope, $rootScope, $window, $location, searchService, paginationService, uidService, previewService, mediaFactory) {
    $rootScope.activeLeftNavItems = ['content', 'media'];
    $rootScope.subNavKey = 'manage_media';

    $scope.searchText = $location.search().q || '';
    $scope.paginationPage = parseInt($location.search().page) || 0;
    $scope.paginationLimit = parseInt($location.search().limit) || 100;
    $scope.pages = [];

    $scope.getMedia = function() {
      $scope.media = null;
      mediaFactory.getMultipleMedia({q: $scope.searchText, $offset: $scope.paginationPage * $scope.paginationLimit, $limit: $scope.paginationLimit}, function(error, media, total) {
        $scope.media = media;
        $scope.totalItems = total;
        $scope.pages = [];
        for(var i = 0; i < Math.ceil(total / $scope.paginationLimit); i++) {
          $scope.pages.push({});
        }
        $scope.setLocationSearch();
      });
    };

    $scope.getUid = function(item) {
      return uidService.getUid(item);
    };

    $scope.search = function() {
      $scope.searchText = angular.element('[ng-model="searchText"]').val();
      $scope.paginationPage = 0;
      $scope.setLocationSearch();
      $scope.getMedia();
    };

    $scope.paginate = function(offset) {
      if(offset < 0) {
        offset = 0;
      }
      else if(offset >= $scope.pages.length) {
        offset = $scope.pages.length - 1;
      }

      if(offset === $scope.paginationPage) {
        return;
      }

      $scope.paginationPage = offset;
      $scope.getMedia();
    };

    $scope.setLocationSearch = function() {
      $location.search({
        q: $scope.searchText.length ? $scope.searchText : null,
        page: $scope.paginationPage,
        limit: $scope.paginationLimit
      });
    };

    $scope.gotoMedia = function(mediaItem) {
      $window.location = '/admin-new/content/media/' + $scope.getUid(mediaItem);
    };

    $scope.getMediaInfo = function(mediaItem) {
      for(var i = 0; i < $scope.media.length; i++) {
        $scope.media[i].infoActive = false;
      }
      mediaItem.infoActive = true;
      $scope.contextMedia = angular.copy(mediaItem);

      $scope.contextMedia.rendered_topics = [];
      angular.forEach($scope.contextMedia.media_topics, function(topic) {
        topicsFactory.getTopic(topic, function(error, topic) {
          if(error) {
            return;
          }

          $scope.contextMedia.rendered_topics.push(topic);
        });
      });
    };

    $scope.getMediaIcon = function(mediaItem) {
      return previewService.getMediaIcon(mediaItem);
    };

    $scope.getMediaPreview = function(mediaItem) {
      return previewService.getMediaPreview(mediaItem);
    };

    $scope.confirmDeletion = function(topic) {
      $scope.objectToDelete = topic;
      $scope.deletionNameKey = 'name';
      angular.element('.deletion-modal').modal('show');
    };

    $scope.deleteObject = function() {
      if(!$scope.objectToDelete) {
        return;
      }

      $scope.deleting = true;
      mediaFactory.deleteMedia($scope.getUid($scope.objectToDelete), function(error, result) {
        if(error) {
          $scope.deleting = false;
          $scope.errorMessage = error.message;
          angular.element('.deletion-modal').modal('hide');
          return;
        }

        angular.element('.deletion-modal').modal('hide');
        $scope.paginationPage = 0;
        $scope.setLocationSearch();
        $scope.getMedia();
      });
    };

    $scope.getMedia();
  });
}());
