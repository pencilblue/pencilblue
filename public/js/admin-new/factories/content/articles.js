(function() {
  'use strict';

  angular.module('pencilblue.admin.factories.content.articles', [
    'ngResource'
  ])
  .factory('articlesFactory', function($resource) {
    return {
      Articles: $resource('/api/content/articles', {}, {
        get: {
          method: 'GET',
          params: {
            q: '@q',
            $offset: '@$offset',
            $limit: '@$limit',
            render: '@render'
          }
        }
      }),

      Article: $resource('/api/content/articles/:id', {id: '@id'}, {
        get: {
          method: 'GET',
          params: {
            id: '@id'
          }
        },
        save: {
          method: 'PUT',
          params: {
            id: '@id'
          }
        },
        saveNew: {
          method: 'POST'
        },
        delete: {
          method: 'DELETE',
          params: {
            id: '@id'
          }
        }
      }),

      getArticles: function(query, cb) {
        var articles = this.Articles.get(query, function() {
          cb(null, articles.data, articles.total);
        }, function(error) {
          cb(error);
        });
      },

      getArticle: function(id, cb) {
        var article = this.Article.get({id: id}, function() {
          cb(null, article);
        }, function(error) {
          cb(error);
        });
      },

      saveArticle: function(id, article, cb) {
        if(!id) {
          this.saveNewArticle(article, cb);
          return;
        }

        this.Article.save({id: id}, article, function() {
          cb(null);
        }, function(error) {
          cb(error);
        });
      },

      saveNewArticle: function(article, cb) {
        var article = this.Article.saveNew({}, article, function() {
          cb(null, article);
        }, function(error) {
          cb(error);
        });
      },

      deleteArticle: function(id, cb) {
        this.Article.delete({id: id}, function() {
          cb(null);
        }, function(error) {
          cb(error);
        });
      }
    };
  });
}());
