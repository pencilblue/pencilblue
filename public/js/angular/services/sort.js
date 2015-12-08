angular.module('sort', [])
.service('sortService', function($filter) {
	this.sort = function(items, field, sortDesc, cb) {
		cb($filter('orderBy')(items, field, sortDesc));
	};

	this.setSortHeader = function(items, headers, headerIndex) {
		if(headers[headerIndex].unsorted) {
			cb(items, headers);
			return;
		}

		var targetHeader;

		for(var i = 0; i < headers.length; i++) {
			if(i === headerIndex) {
				targetHeader = headers[i];

				if(headers[i].sortAsc) {
					headers[i].sortAsc = false;
					headers[i].sortDesc = true;
				}
				else {
					headers[i].sortAsc = true;
					headers[i].sortDesc = false;
				}
			}
			else {
				headers[i].sortAsc = false;
				headers[i].sortDesc = false;
			}
		}

		return targetHeader;
	};

	this.sortByHeader = function(items, headers, headerIndex, cb) {
		var targetHeader = this.setSortHeader(items, headers, headerIndex);

		this.sort(items, headers[headerIndex].field, targetHeader.sortDesc, function(items) {
			cb(items, headers);
		});
	};
});
