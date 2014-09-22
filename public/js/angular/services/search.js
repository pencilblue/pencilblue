angular.module('search', [])
.service('searchService', function($filter) {
	this.search = function(searchText, items, searchFields, cb) {
		if(!searchFields.length || !items) {
			cb(items);
			return;
		}

		for(var i = 0; i < items.length; i++) {
			delete items[i].hidden;
		}

		if(!searchText || !searchText.length) {
			cb(items);
			return;
		}

		if(searchText.length <= 2) {
			cb(items);
			return;
		}

		searchText = searchText.toLowerCase();

		for(i = 0; i < items.length; i++) {
			items[i].hidden = true;
			for(var j = 0; j < searchFields.length; j++) {
				if(!items[i][searchFields[j]]) {
					continue;
				}

				if(items[i][searchFields[j]].toLowerCase().indexOf(searchText) >= 0) {
					items[i].hidden = false;
					break;
				}
			}
		}

		cb(items);
	};
})
