(function() {
  'use strict';

  angular.module('pencilblue.admin.app', [
    'ngRoute',
    'ngSanitize',
    'ngResource',
    'moment-picker',
    'pencilblue.admin.elements.leftNav',
    'pencilblue.admin.elements.pillNav',
    'pencilblue.admin.elements.topicsSelect',
    'pencilblue.admin.services.uid',
    'pencilblue.admin.directives.goBack',
    'pencilblue.admin.directives.wysiwyg',
    'pencilblue.admin.factories.content.articles',
    'pencilblue.admin.factories.users'
  ])
  .controller('AdminArticlesFormController', function($scope, $rootScope, $sce, $window, uidService, articlesFactory, usersFactory) {
    $rootScope.activeLeftNavItems = ['content', 'articles'];
    $rootScope.subNavKey = 'article_form';

    $scope.articleId = articleId.length ? articleId : null;
    $scope.urlGenerated = null;
    $scope.urlAvailable = null;

    $scope.getArticle = function() {
      if(!$scope.articleId) {
        $scope.article = {
          article_topics: []
        };
        $rootScope.selectedTopics = $scope.article.article_topics;
        return;
      }

      articlesFactory.getArticle($scope.articleId, function(error, article) {
        $scope.headline = article.headline;
        $scope.article = article;
        $scope.article.publish_date = moment($scope.article.publish_date).toDate();
        $scope.article.created = moment($scope.article.created).toDate();
        $scope.article.last_modified = moment($scope.article.last_modified).toDate();

        $rootScope.selectedTopics = $scope.article.article_topics;

        $scope.getArticlePreview();
      });
    };

    $scope.getArticlePreview = function() {
      articlesFactory.getArticle($scope.articleId, 1, function(error, article) {
        $scope.articlePreview = article.article_layout;
      });
    };

    $scope.getArticlePreviewHtml = function() {
      return $sce.trustAsHtml($scope.articlePreview);
    };

    $scope.getAvailableAuthors = function() {
      usersFactory.getUsers({role: [1, 2, 3, 4]}, function(error, users) {
        $scope.availableAuthors = users;
      });
    };

    $scope.getUid = function(article) {
      return uidService.getUid(article);
    };

    $scope.saveArticle = function() {
      $scope.formSubmitted = true;
      /*if(!$scope.articleForm.$valid) {
        return;
      }*/

      $scope.saving = true;
      $scope.errorMessage = null;
      articlesFactory.saveArticle(uidService.getUid($scope.article), $scope.article, function(error, article) {
        $scope.saving = false;
        if(error) {
          $scope.errorMessage = error.message;
          return;
        }
        $scope.saveSuccess = true;

        if($scope.articleId) {
          $scope.headline = $scope.article.headline;
          $scope.getArticlePreview();
        }
        else {
          $window.location = '/admin-new/content/articles/' + uidService.getUid(article);
        }
      });
    };

    $scope.$watch('article', function(newVal, oldVal) {
      if(newVal !== oldVal) {
        $scope.saveSuccess = false;
      }
    }, true);

    $scope.getArticle();
    $scope.getAvailableAuthors();
  });
}());
