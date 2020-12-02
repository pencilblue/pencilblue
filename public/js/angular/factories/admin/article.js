(function() {
  angular.module('pencilblue.factories.admin.articles', [])
  .factory('articleFactory', function($http) {
    return {
      getArticles: function(options, cb) {
        var queryString = '';
        for(var key in options) {
          if(queryString.length) {
            queryString += '&';
          }
          else {
            queryString += '?';
          }

          queryString += key + '=' + options[key];
        }

        $http.get('/api/content/articles' + queryString)
        .then(function({data: result}) {
          cb(null, result.data, result.total);
        })
        .catch(function({data: error}) {
          cb(error);
        });
      },

      deleteArticle: function(id, cb) {
        $http({
          method: 'DELETE',
          url: '/api/content/articles/' + id
        })
        .then(function({data: result}) {
          cb(null, result);
        })
        .catch(function({data: error}) {
          cb(error);
        });
      }
    };
  });
}());
