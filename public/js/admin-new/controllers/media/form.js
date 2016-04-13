(function() {
  'use strict';

  angular.module('pencilblue.admin.app', [
    'ngRoute',
    'ngSanitize',
    'ngResource',
    'moment-picker',
    'pencilblue.admin.elements.leftNav',
    'pencilblue.admin.elements.pillNav',
    'pencilblue.admin.elements.topicsSelect',
    'pencilblue.admin.services.uid',
    'pencilblue.admin.services.preview',
    'pencilblue.admin.directives.goBack',
    'pencilblue.admin.factories.content.media'
  ])
  .controller('AdminMediaFormController', function($scope, $rootScope, $window, uidService, previewService, mediaFactory) {
    $rootScope.activeLeftNavItems = ['content', 'media'];
    $rootScope.subNavKey = 'media_form';

    $scope.mediaId = mediaId.length ? mediaId : null;
    $scope.linkedMedia = {};

    $scope.getMedia = function() {
      if(!$scope.mediaId) {
        $scope.mediaItem = {
          media_topics: []
        };
        $rootScope.selectedTopics = $scope.mediaItem.media_topics;
        return;
      }

      mediaFactory.getMedia($scope.mediaId, function(error, media) {
        $scope.mediaName = media.name;
        $scope.mediaItem = media;
        $scope.mediaItem.created = moment($scope.mediaItem.created).toDate();
        $scope.mediaItem.last_modified = moment($scope.mediaItem.last_modified).toDate();

        $rootScope.selectedTopics = $scope.mediaItem.media_topics;
      });
    };

    $scope.getUid = function(item) {
      return uidService.getUid(item);
    };

    $scope.getMediaIcon = function(mediaItem) {
      return previewService.getMediaIcon(mediaItem);
    };

    $scope.getMediaPreview = function(mediaItem) {
      return previewService.getMediaPreview(mediaItem);
    };

    $scope.showMediaModal = function(upload) {
      $scope.uploadingMedia = upload;
      angular.element('.media-modal').modal('show');
    };

    $scope.linkToMedia = function(url) {
      $scope.linking = true;

      mediaFactory.getMediaLocation(url, function(error, location) {
        $scope.linking = false;
        angular.element('.media-modal').modal('hide');

        if(error) {
          $scope.errorMessage = error.message;
          return;
        }
        $scope.mediaItem.location = location;
      });
    };

    $scope.saveMedia = function() {
      $scope.formSubmitted = true;
      /*if(!$scope.mediaForm.$valid) {
        return;
      }*/

      $scope.saving = true;
      $scope.errorMessage = null;
      mediaFactory.saveMedia(uidService.getUid($scope.mediaItem), $scope.mediaItem, function(error, media) {
        $scope.saving = false;
        if(error) {
          $scope.errorMessage = error.message;
          return;
        }
        $scope.saveSuccess = true;

        if($scope.mediaId) {
          $scope.mediaName = $scope.mediaItem.mediaName;
        }
        else {
          $window.location = '/admin-new/content/media/' + uidService.getUid(media);
        }
      });
    };

    $scope.$watch('media', function(newVal, oldVal) {
      if(newVal !== oldVal) {
        $scope.saveSuccess = false;
      }
    }, true);

    $scope.getMedia();
  });
}());
