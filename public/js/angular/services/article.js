(function() {
  angular.module('pencilblue.services.article', [])
  .service('articleService', function() {
    this.setArticleStatuses = function(articles) {
			var now = new Date();

			for(var i = 0; i < articles.length; i++) {
				if(articles[i].draft) {
					articles[i].status = loc.articles.DRAFT;
				}
				else if(articles[i].publish_date > now) {
					articles[i].status = loc.articles.UNPUBLISHED;
				}
				else {
					articles[i].status = loc.articles.PUBLISHED;
				}
			}

			return articles;
		};
  });
}());
