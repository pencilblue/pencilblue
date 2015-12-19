(function() {
  angular.module('wysiwygElement', [])
  .directive('wysiwyg', function($sce, $http, $document, $interval, $window) {
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

          /*if(!$document[0].queryCommandState('insertorderedlist') && !$document[0].queryCommandState('insertunorderedlist') && !scope.getSelection().length) {
            scope.setElement('p');
          }*/
          
          return scope.availableElements[0];
        };

        scope.formatAction = function(action, args) {
          if(scope.wysiwyg.currentView !== 'editable') {
            return;
          }

          $document[0].execCommand(action, false, args);
        };

        scope.isFormatActive = function(type) {
          return $document[0].queryCommandState(type);
        };

        scope.clearStyles = function() {
          scope.formatAction('removeFormat');
        };

        scope.showInsertLinkModal = function() {
          if(!scope.layoutLink) {
            scope.layoutLink = {
              newTab: true
            };
          }

          scope.layoutLink.text = scope.getSelection();
          scope.saveSelection(true);
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
          scope.saveSelection(true);
          scope.restoreSelection();
          scope.formatAction('inserthtml', '<hr class="read_more_break"></hr>');
        };

        scope.mediaAvailable = function() {
          if(scope.media && scope.media instanceof Array) {
            return true;
          }

          return false;
        };

        scope.showInsertMediaModal = function() {
          angular.element(element).find('[contenteditable]').focus();
          scope.saveSelection(true);
          angular.element(element).find('[insert-media-modal]').modal('show');
        };

        scope.associateMedia = function() {
          angular.element(element).find('[insert-media-modal]').modal('hide');
          angular.element('.nav-tabs a[href="#media"]').tab('show');
        };

        scope.insertMedia = function() {
          var mediaFormat = scope.getMediaFormat();
          scope.formatAction('inserthtml', '<div>^media_display_' + scope.wysiwyg.selectedMediaItem._id + mediaFormat + '^</div>');

          angular.element(element).find('[insert-media-modal]').modal('hide');
          scope.restoreSelection();
          scope.wysiwyg.layout = angular.element(element).find('[contenteditable]').html();
        };

        scope.getMediaFormat = function() {
          var mediaFormat = '/position:' + scope.wysiwyg.mediaPosition;

          if(scope.wysiwyg.mediaMaxHeight) {
            mediaFormat = mediaFormat.concat(',maxHeight:' + scope.wysiwyg.mediaMaxHeight + scope.wysiwyg.mediaMaxHeightUnit);
          }

          return mediaFormat;
        };

        scope.saveSelection = function(force) {
          if(!angular.element(element).find('[contenteditable]').is(':focus') && !force) {
            return;
          }

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

        scope.getSelection = function() {
          if(scope.editableSelection) {
            return rangy.getSelection().toString();
          }

          return '';
        };

        scope.loadMediaPreviews = function() {
          if(scope.wysiwyg.currentView !== 'editable') {
            return;
          }

          var mediaDisplayPrefix = '^media_display_';

          var index = scope.wysiwyg.layout.indexOf(mediaDisplayPrefix);
          if(index === -1) {
            return;
          }

          var startIndex = index + mediaDisplayPrefix.length;
          var endIndex = scope.wysiwyg.layout.substr(startIndex).indexOf('^');
          var mediaProperties = scope.wysiwyg.layout.substr(startIndex, endIndex).split('/');
          var mediaID = mediaProperties[0];
          var mediaTag = scope.wysiwyg.layout.substr(startIndex - (mediaDisplayPrefix.length - 1), endIndex + (mediaDisplayPrefix.length - 1));

          $http.get('/api/content/get_media_embed?id=' + mediaID + '&tag=' + encodeURIComponent(mediaTag))
          .success(function(result) {
            if(!result.code) {
              var mediaPreview = result.data;

              scope.wysiwyg.layout = scope.wysiwyg.layout.split('^' + mediaTag + '^').join(mediaPreview);
              if(scope.wysiwyg.layout.indexOf(mediaDisplayPrefix) > -1) {
                scope.loadMediaPreviews();
              }
            }
          });
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
              'height': (angular.element(element).height() - angular.element(element).find('.content_layout').position().top) + 'px',
              'margin': '0'
            });
          }
          else {
            angular.element(element).attr('style', '');
            angular.element(element).find('.content_layout').attr('style', '');
          }
        };

        scope.setPublicLayout = function() {
          if(!scope.wysiwyg.layout.length) {
            scope.layout = '';
            return;
          }

          if(scope.wysiwyg.currentView === 'html') {
            scope.wysiwyg.layout = scope.layout.toString();
            return;
          }

          var self = this;

          scope.tempEditable = angular.element(element).find('.temp_editable');
          scope.tempEditable.html(scope.wysiwyg.layout.toString());

          var j = 0;
          var selectionCount = scope.tempEditable.find('.rangySelectionBoundary').length;
          if(selectionCount === 0) {
            scope.convertMedia();
            return;
          }

          scope.tempEditable.find('.rangySelectionBoundary').each(function() {
            angular.element(this).replaceWith('');

            j++;
            if(j >= selectionCount) {
              scope.convertMedia();
            }
          });
        };

        scope.convertReadMore = function() {
          var s = 0;
          var readMoreCount = scope.tempEditable.find('.read_more_break').length;

          if(readMoreCount === 0) {
            scope.layout = scope.tempEditable.html();
            return;
          }

          scope.tempEditable.find('.read_more_break').each(function() {
            if(s === 0) {
              angular.element(this).replaceWith('^read_more^');
            }
            else {
              angular.element(this).replaceWith('');
            }

            s++;
            if(s >= readMoreCount) {
              scope.layout = scope.tempEditable.html();
            }
          });
        };

        scope.convertMedia = function() {
          var i = 0;
          var mediaCount = scope.tempEditable.find('.media_preview').length;
          if(mediaCount === 0) {
            scope.convertReadMore();
            return;
          }

          scope.tempEditable.find('.media_preview').each(function() {
            var mediaTags = ['^' + angular.element(this).attr('media-tag') + '^'];
            var subTags = angular.element(this).find('[media-tag]');
            for(var j = 0; j < subTags.length; j++) {
              mediaTags.push('^' + $(subTags[j]).attr('media-tag') + '^');
            }

            angular.element(this).replaceWith(mediaTags.concat(''));

            i++;
            if(i >= mediaCount){
              scope.convertReadMore();
            }
          });
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
            scope.wysiwyg.markdown = toMarkdown(scope.layout);
          }

          //scope.saveSelection();
        });

        scope.$watch('layout', function(newVal, oldVal) {
          if(scope.wysiwyg.currentView !== 'html') {
            return;
          }

          if(newVal !== oldVal) {
            scope.wysiwyg.markdown = toMarkdown(scope.layout);
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
        editableDiv.on('mouseup', function(event) {
          if(!scope.wysiwyg.layout.length) {
            scope.setElement(loc.wysiwyg.NORMAL_TEXT, 'p');
          }

          scope.saveSelection();
          scope.$apply();
        });

        rangy.init();
        $interval(scope.loadMediaPreviews, 500);
        $interval(scope.setPublicLayout, 500);
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
    };
  });
}());
