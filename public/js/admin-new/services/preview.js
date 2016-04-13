(function() {
  'use strict';

  angular.module('pencilblue.admin.services.preview', [])
  .service('previewService', function($sce) {
    this.getMediaIcon = function(mediaItem) {
      switch(mediaItem.media_type) {
        case 'youtube':
          return 'youtube';
      }

      return 'image';
    };

    this.getMediaPreview = function(mediaItem) {
      var embedString;

      switch(mediaItem.media_type) {
        case 'youtube':
          embedString = '<div class="embed-responsive embed-responsive-16by9"><iframe width="560" height="315" src="https://www.youtube.com/embed/' + mediaItem.location + '" frameborder="0" allowfullscreen></iframe></div>';
          break;
        case 'image':
          embedString = '<img class="context-image" src="' + mediaItem.location + '"></img>';
          break;
      }

      return $sce.trustAsHtml(embedString);
    };
  });
}());
