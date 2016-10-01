angular.module('search', [])
.service('searchService', function($filter) {

	this.multiSearch = function(patternSearch, items, cb){
		if(!patternSearch || !items || !Array.isArray(patternSearch)){
			cb(items);
		}
		for(var i = 0; i < items.length; i++) {
				delete items[i].hidden;
		}

		for(var z = 0; z < patternSearch.length; z++){
			var ps = patternSearch[z];
			if(!ps.searchFields.length){
				continue;
			}
			if(!ps.searchText || !ps.searchText.length || ps.searchText.length <= 2){
				continue;
			}
			ps.searchText = ps.searchText.toLowerCase();

			for(i = 0; i < items.length; i++) {


				for(var j = 0; j < ps.searchFields.length; j++) {
					if(!items[i][ps.searchFields[j]]) {
						continue;
					}
					var val = items[i][ps.searchFields[j]];
					if (items[i].hidden !== true && Array.isArray(val) && val.indexOf(ps.searchText) >= 0){
								items[i].hidden = false;
						break;
					}else if( items[i].hidden !== true && !Array.isArray(val) && val.toLowerCase().indexOf(ps.searchText) >= 0) {
						items[i].hidden = false;
						break;
					}else{
						items[i].hidden = true;
					}
				}
			}
		}



		cb(items);
	}
	this.search = function(searchText, items, searchFields, cb) {
		var patternSearch = [{
			searchText : searchText,
			searchFields : searchFields
		}]
		this.multiSearch(patternSearch, items, cb);
	};
})
