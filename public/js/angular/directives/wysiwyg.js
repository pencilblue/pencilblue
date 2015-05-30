(function() {
  angular.module('wysiwygElement', [])
  .directive('wysiwyg', function($sce, $document, $window) {
    return {
      restrict: 'AE',
      replace: true,
      templateUrl: '/admin/elements/wysiwyg',
      scope: {
        layout: '=',
        media: '='
      },
      link: function(scope, element, attrs) {
        scope.wysiwyg = {
          currentView: 'editable',
          layout: scope.layout ? scope.layout.toString() : '',
          markdown: toMarkdown(scope.layout ? scope.layout.toString() : ''),
          selectedMediaItem: null,
          mediaPosition: 'none',
          mediaMaxHeightUnit: 'px',
          fullscreen: false
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
        };

        scope.getCurrentElement = function() {
          var block = $document[0].queryCommandValue('formatblock');

          for(var i = 0; i < scope.availableElements.length; i++) {
            if(scope.availableElements[i].type === block) {
              return scope.availableElements[i];
            }
          }

          scope.setElement('p');
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

        scope.showInsertLinkModal = function() {
          scope.layoutLink = {
            newTab: true
          };

          scope.saveSelection();
          angular.element(element).find('[insert-link-modal]').modal('show');
        };

        scope.testLayoutLink = function() {
          $window.open(scope.layoutLink.url, '_blank');
        };

        scope.insertLayoutLink = function() {
          angular.element(element).find('[insert-link-modal]').modal('hide');
          scope.restoreSelection();

          var link = '<a href="' + scope.layoutLink.url + '" ' + (scope.layoutLink.newTab ? 'target="_blank"' : '') + '>' + scope.layoutLink.text + '</a>';
          scope.formatAction('inserthtml', link);
        };

        scope.insertReadMore = function() {
          scope.restoreSelection();
          scope.formatAction('inserthtml', '<hr class="read_more_break"></hr>');
        }

        scope.showInsertMediaModal = function() {
          scope.saveSelection();
          angular.element(element).find('[insert-media-modal]').modal('show');
        };

        scope.associateMedia = function() {
          angular.element(element).find('[insert-media-modal]').modal('hide');
          angular.element('.nav-tabs a[href="#media"]').tab('show');
        };

        scope.insertMedia = function() {
          angular.element(element).find('[insert-media-modal]').modal('hide');
          scope.restoreSelection();

          var mediaFormat = scope.getMediaFormat();
          scope.formatAction('inserthtml', '<div>^media_display_' + scope.wysiwyg.selectedMediaItem._id + mediaFormat + '^</div>');
        };

        scope.getMediaFormat = function() {
          var mediaFormat = '/position:' + scope.wysiwyg.mediaPosition;

          if(scope.wysiwyg.mediaMaxHeight) {
            mediaFormat = mediaFormat.concat(',maxheight:' + scope.wysiwyg.mediaMaxHeight + scope.wysiwyg.mediaMaxHeightUnit);
          }

          return mediaFormat;
        }

        scope.saveSelection = function() {
          if(scope.editableSelection) {
            rangy.removeMarkers(scope.editableSelection);
          }
          scope.editableSelection = rangy.saveSelection();
        };

        scope.restoreSelection = function() {
          if(scope.editableSelection) {
            rangy.restoreSelection(scope.editableSelection, true);
            scope.editableSelection = null;
          }
        };

        scope.toggleFullscreen = function() {
          scope.wysiwyg.fullscreen = !scope.wysiwyg.fullscreen;

          if(scope.wysiwyg.fullscreen) {
            angular.element(element).css({
              'background-color': '#FFFFFF',
              'position': 'fixed',
              'top': '0',
              'left': '0',
              'width': '100%',
              'height': '100%',
              'overflow': 'auto',
              'z-index': '10000'
            }).focus();

            angular.element(element).find('.content_layout').css({
              'height': (angular.element(element).height() - angular.element(element).find('.content_layout').position().top - 5) + 'px',
              'margin': '0'
            });
          }
          else {
            angular.element(element).attr('style', '');
            angular.element(element).find('.content_layout').attr('style', '');
          }
        };

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

          scope.saveSelection();
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
        editableDiv.on('mouseup', function(event) {
          if(!scope.wysiwyg.layout.length) {
            scope.setElement(loc.wysiwyg.NORMAL_TEXT, 'p');
          }

          scope.saveSelection();
          scope.$apply();
        });

        rangy.init();
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
