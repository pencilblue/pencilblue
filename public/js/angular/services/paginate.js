angular.module('paginate', [])
.service('paginationService', function() {
	this.paginate = function(items, testIndex, limit, cb) {
		var itemCount = 0;

		for(var i = 0; i < items.length; i++) {
			if(!items[i].hidden) {
				itemCount++;
				items[i].paginated = itemCount <= testIndex * limit || itemCount > testIndex * limit + limit;
			}
			else {
				items[i].paginated = true;
			}
		}

		var pageLimit = Math.ceil(itemCount / limit);
		var pages = [];
		for(i = 0; i < pageLimit; i++) {
			pages.push({active: i === testIndex});
		}

		cb(items, pages);
	};

	this.pageButtonVisible = function(testIndex, pageIndex, pageLimit, maxButtons) {
		if(typeof maxButtons === 'undefined') {
			maxButtons = 5;
		}

		if(pageIndex <= Math.floor(maxButtons / 2)) {
			if(testIndex < maxButtons) {
				return true;
			}

			return false;
		}

		if(pageIndex >= pageLimit - Math.ceil(maxButtons / 2)) {
			if(testIndex > pageLimit - (maxButtons + 1)) {
				return true;
			}

			return false;
		}

		var upperLimit = Math.floor(maxButtons / 2);
		if(maxButtons % 2 === 0) {
			upperLimit -= 1;
		}

		if(testIndex >= pageIndex - Math.floor(maxButtons / 2) && testIndex <= pageIndex + upperLimit) {
			return true;
		}

		return false;
	};
})
