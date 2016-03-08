(function() {
  'use strict';

  angular.module('pencilblue.admin.services.uid', [])
  .service('uidService', function() {
    this.getUid = function(item) {
      return item._id || item.id || item.uid || null;
    };
  });
}());
