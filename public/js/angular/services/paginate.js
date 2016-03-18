angular.module('paginate', [])
.service('paginationService', function() {
	this.paginate = function(items, offset, limit, cb) {
		var itemCount = 0;

		for(var i = 0; i < items.length; i++) {
			if(!items[i].hidden) {
				itemCount++;
				items[i].paginated = itemCount <= offset * limit || itemCount > offset * limit + limit;
			}
			else {
				items[i].paginated = true;
			}
		}

		var pages = this.getPageArray(offset, limit, itemCount);

		cb(items, pages);
	};

	this.getPageArray = function(offset, limit, total) {
		var pageLimit = Math.ceil(total / limit);
		var pages = [];
		for(i = 0; i < pageLimit; i++) {
			pages.push({active: i === offset});
		}

		return pages;
	};

	this.paginationValid = function(newOffset, currentOffset, pageCount) {
		if(newOffset === currentOffset) {
			return false;
		}
		if(newOffset !== 0 && newOffset >= pageCount) {
			return false;
		}
		if(newOffset < 0) {
			return false;
		}

		return true;
	};

	this.pageButtonVisible = function(offset, pageIndex, pageLimit, maxButtons) {
		if(typeof maxButtons === 'undefined') {
			maxButtons = 5;
		}

		if(pageIndex <= Math.floor(maxButtons / 2)) {
			if(offset < maxButtons) {
				return true;
			}

			return false;
		}

		if(pageIndex >= pageLimit - Math.ceil(maxButtons / 2)) {
			if(offset > pageLimit - (maxButtons + 1)) {
				return true;
			}

			return false;
		}

		var upperLimit = Math.floor(maxButtons / 2);
		if(maxButtons % 2 === 0) {
			upperLimit -= 1;
		}

		if(offset >= pageIndex - Math.floor(maxButtons / 2) && offset <= pageIndex + upperLimit) {
			return true;
		}

		return false;
	};
});
