(function() {
  'use strict';

  angular.module('pencilblue.admin.services.textFormatting', [])
  .service('textFormattingService', function() {
    this.stripHtml = function(html) {
      return html.replace(/(<([^>]+)>)/ig, ' ').replace(/(\^([^\^]+)\^)/ig, ' ');
    };

    this.trimByWords = function(copy, maxWords) {
      var splitCopy = copy.split(' ');

      if(splitCopy.length <= maxWords) {
        return copy;
      }

      var newCopy = '';
      for(var i = 0; i < maxWords; i++) {
        if(i > 0) {
          newCopy += ' ';
        }
        newCopy += splitCopy[i];
      }

      return newCopy;
    }
  });
}());
