(function() {
  angular.module('wysiwygElement', [])
  .directive('wysiwyg', function($sce, $document) {
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

        scope.availableElements = [{
          name: loc.wysiwyg.NORMAL_TEXT,
          type: 'p'
        }, {
          name: loc.wysiwyg.QUOTE,
          type: 'blockquote'
        }, {
          name: loc.wysiwyg.PRE,
          type: 'pre'
        }, {
          name: loc.wysiwyg.HEADING_1,
          type: 'h1'
        }, {
          name: loc.wysiwyg.HEADING_2,
          type: 'h2'
        }, {
          name: loc.wysiwyg.HEADING_3,
          type: 'h3'
        }, {
          name: loc.wysiwyg.HEADING_4,
          type: 'h4'
        }, {
          name: loc.wysiwyg.HEADING_5,
          type: 'h5'
        }, {
          name: loc.wysiwyg.HEADING_6,
          type: 'h6'
        }];

        scope.setLayoutView = function(view) {
          scope.wysiwyg.currentView = view;
        };

        scope.setElement = function(type) {
          scope.formatAction('formatblock', type);
          scope.getCurrentElement();
        };

        scope.getCurrentElement = function() {
          var block = $document[0].queryCommandValue('formatblock');

          for(var i = 0; i < scope.availableElements.length; i++) {
            if(scope.availableElements[i].type === block) {
              return scope.availableElements[i];
            }
          }

          return scope.availableElements[0];
        }

        scope.formatAction = function(action, arguments) {
          if(scope.wysiwyg.currentView !== 'editable') {
            return;
          }

          $document[0].execCommand(action, false, arguments);
        };

        scope.isFormatActive = function(type) {
          return $document[0].queryCommandState(type)
        }

        scope.$watch('wysiwyg.layout', function(newVal, oldVal) {
          if(scope.wysiwyg.currentView !== 'editable') {
            return;
          }

          // Remove crappy line-height spans in Chrome
          editableDiv.find('span').each(function() {
            angular.element(this).css('line-height', '');
          });

          if(newVal !== oldVal) {
            scope.wysiwyg.markdown = toMarkdown(newVal);
          }
        });

        scope.$watch('wysiwyg.markdown', function(newVal, oldVal) {
          if(scope.wysiwyg.currentView !== 'markdown') {
            return;
          }

          if(newVal !== oldVal) {
            scope.wysiwyg.layout = markdown.toHTML(newVal);
          }
        });

        var editableDiv = angular.element(element).find('[contenteditable]');
        var range = rangy.createRange();
        editableDiv.on('mouseup', function(event) {
          if(!scope.wysiwyg.layout.length) {
            scope.setElement(loc.wysiwyg.NORMAL_TEXT, 'p');
          }

          scope.$apply();

          range.selectNodeContents(editableDiv[0]);
          scope.editableRange = rangy.getSelection();
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
