angular.module('sort', [])
.service('sortService', function($filter) {
	this.sort = function(items, field, sortDesc, cb) {
		cb($filter('orderBy')(items, field, sortDesc));
	};
})
