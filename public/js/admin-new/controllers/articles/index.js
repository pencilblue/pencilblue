(function() {
  'use strict';

  angular.module('pencilblue.admin.app', [
    'ngRoute',
    'ngSanitize',
    'ngResource',
    'pencilblue.services.search',
    'pencilblue.services.paginate',
    'pencilblue.admin.elements.leftNav',
    'pencilblue.admin.elements.pillNav',
    'pencilblue.admin.services.uid',
    'pencilblue.admin.factories.content.articles',
    'pencilblue.admin.factories.content.topics'
  ])
  .controller('AdminArticlesListController', function($scope, $rootScope, $location, $window, $sce, searchService, paginationService, uidService, articlesFactory, topicsFactory) {
    $rootScope.activeLeftNavItems = ['content', 'articles'];
    $rootScope.subNavKey = 'manage_articles';

    $scope.searchText = $location.search().q || '';
    $scope.paginationPage = parseInt($location.search().page) || 0;
    $scope.paginationLimit = parseInt($location.search().limit) || 12;
    $scope.pages = [];

    $scope.articleStatus = {
      PUBLISHED: 0,
      DRAFT: 1,
      UNPUBLISHED: 2
    };

    $scope.getArticles = function() {
      $scope.articles = null;
      articlesFactory.getArticles({q: $scope.searchText, $offset: $scope.paginationPage * $scope.paginationLimit, $limit: $scope.paginationLimit, render: 1}, function(error, articles, total) {
        var now = new Date();
        for(var j = 0; j < articles.length; j++) {
          if(articles[j].draft) {
            articles[j].status = $scope.articleStatus.DRAFT;
          }
          else if(articles[j].publish_date > now) {
            articles[j].status = $scope.articleStatus.UNPUBLISHED;
          }
          else {
            articles[j].status = $scope.articleStatus.PUBLISHED;
          }
        }

        $scope.articles = articles;
        $scope.totalItems = total;
        $scope.pages = [];
        for(var i = 0; i < Math.ceil(total / $scope.paginationLimit); i++) {
          $scope.pages.push({});
        }
        $scope.setLocationSearch();
      });
    };

    $scope.getUid = function(item) {
      return uidService.getUid(item);
    };

    $scope.getArticleHtml = function(article) {
      return $sce.trustAsHtml(article.layout);
    };

    $scope.search = function() {
      $scope.searchText = angular.element('[ng-model="searchText"]').val();
      $scope.paginationPage = 0;
      $scope.setLocationSearch();
      $scope.getArticles();
    };

    $scope.paginate = function(offset) {
      if(offset < 0) {
        offset = 0;
      }
      else if(offset >= $scope.pages.length) {
        offset = $scope.pages.length - 1;
      }

      if(offset === $scope.paginationPage) {
        return;
      }

      $scope.paginationPage = offset;
      $scope.getArticles();
    };

    $scope.setLocationSearch = function() {
      $location.search({
        q: $scope.searchText.length ? $scope.searchText : null,
        page: $scope.paginationPage,
        limit: $scope.paginationLimit
      });
    };

    $scope.gotoArticle = function(article) {
      $window.location = '/admin-new/content/articles/' + $scope.getUid(article);
    };

    $scope.getArticleInfo = function(article) {
      for(var i = 0; i < $scope.articles.length; i++) {
        $scope.articles[i].infoActive = false;
      }
      article.infoActive = true;
      $scope.contextArticle = article;

      $scope.contextArticle.rendered_topics = [];
      angular.forEach($scope.contextArticle.article_topics, function(topic) {
        topicsFactory.getTopic(topic, function(error, topic) {
          if(error) {
            return;
          }

          $scope.contextArticle.rendered_topics.push(topic);
        });
      });
    };

    $scope.confirmDeletion = function(article) {
      $scope.objectToDelete = article;
      $scope.deletionNameKey = 'headline';
      angular.element('.deletion-modal').modal('show');
    };

    $scope.deleteObject = function() {
      if(!$scope.objectToDelete) {
        return;
      }

      $scope.deleting = true;
      articlesFactory.deleteArticle($scope.getUid($scope.objectToDelete), function(error, result) {
        if(error) {
          $scope.deleting = false;
          $scope.errorMessage = error.message;
          angular.element('.deletion-modal').modal('hide');
          return;
        }

        angular.element('.deletion-modal').modal('hide');
        $scope.paginationPage = 0;
        $scope.setLocationSearch();
        $scope.getArticles();
      });
    };

    $scope.getArticles();
  });
}());
