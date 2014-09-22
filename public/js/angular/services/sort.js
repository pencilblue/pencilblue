angular.module('sort', [])
.service('sortService', function($filter) {
	this.sort = function(items, field, sortDesc, cb) {
		cb($filter('orderBy')(items, field, sortDesc));
	};

	this.sortByHeader = function(items, headers, headerIndex, cb) {
		if(headers[headerIndex].unsorted) {
			cb(items, headers);
			return;
		}

		var sortDesc = true;

		for(var i = 0; i < headers.length; i++) {
			if(i === headerIndex) {
				if(headers[i].sortAsc) {
					headers[i].sortAsc = false;
					headers[i].sortDesc = true;
				}
				else {
					headers[i].sortAsc = true;
					headers[i].sortDesc = false;
					sortDesc = false;
				}
			}
			else {
				headers[i].sortAsc = false;
				headers[i].sortDesc = false;
			}
		}

		this.sort(items, headers[headerIndex].field, sortDesc, function(items) {
			cb(items, headers);
		});
	}
})
