(function() {
  angular.module('wysiwygElement', [])
  .directive('wysiwyg', function($sce) {
    return {
      restrict: 'AE',
      replace: true,
      templateUrl: '/admin/elements/wysiwyg',
      scope: {
        layout: '='
      },
      link: function(scope, element, attrs) {
        scope.wysiwyg = {
          currentView: 'editable',
          layout: scope.layout ? scope.layout.toString() : '',
          markdown: toMarkdown(scope.layout ? scope.layout.toString() : '')
        };

        scope.setLayoutView = function(view) {
          scope.wysiwyg.currentView = view;
        };

        scope.$watch('wysiwyg.layout', function(newVal, oldVal) {
          if(scope.wysiwyg.currentView === 'markdown') {
            return;
          }

          if(newVal !== oldVal) {
            scope.wysiwyg.markdown = toMarkdown(newVal);
          }
        });

        scope.$watch('wysiwyg.markdown', function(newVal, oldVal) {
          if(newVal !== oldVal) {
            scope.wysiwyg.layout = markdown.toHTML(newVal);
          }
        });
      }
    };
  })
  .directive('contenteditable', function($sce) {
    return {
      restrict: 'A',
      require: '?ngModel',
      scope: false,
      link: function(scope, element, attrs, ngModel) {
        if(!ngModel) {
          return;
        }

        ngModel.$render = function() {
          element.html($sce.getTrustedHtml($sce.trustAsHtml(ngModel.$viewValue || '')));
        };

        // Listen for change events to enable binding
        element.on('blur keyup change', function() {
          scope.$evalAsync(read);
        });
        read(); // initialize

        // Write data to the model
        function read() {
          var html = element.html();
          // When we clear the content editable the browser leaves a <br> behind
          // If strip-br attribute is provided then we strip this out
          if ( attrs.stripBr && html == '<br>' ) {
            html = '';
          }
          ngModel.$setViewValue(html);
        }
      }
    }
  });
}());
