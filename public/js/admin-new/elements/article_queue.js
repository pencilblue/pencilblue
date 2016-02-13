(function() {
  'use strict';

  angular.module('pencilblue.admin.elements.articleQueue', [
    'pencilblue.admin.services.textFormatting'
  ])
  .controller('ArticleQueueController', function($scope, $http, textFormattingService) {
    $scope.getArticles = function() {
      $http.get('/api/content/articles?$limit=3')
      .success(function(result) {
        $scope.articles = result.data;
      });
    };

    $scope.getEditArticleUrl = function(article) {
      var articleId = article._id || article.id || null;

      if(!articleId) {
        return '';
      }

      return '/admin-new/content/articles/' + articleId;
    };

    $scope.getArticleSnippet = function(layout) {
      var strippedLayout = textFormattingService.stripHtml(layout);
      var snippet = textFormattingService.trimByWords(strippedLayout, 40);
      if(snippet === strippedLayout) {
        return snippet;
      }

      return snippet + '...';
    };

    $scope.getArticles();
  });
}());
