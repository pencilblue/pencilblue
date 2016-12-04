//dependencies
var should        = require('should');
var Configuration = require('../../include/config.js');
var Lib           = require('../../lib');

describe('Libraries', function() {

    var pb = null;
    var LibrariesService = null;
    before('Initialize the Environment with the default configuration', function() {
        this.timeout(10000);

        pb = new Lib(Configuration.getBaseConfig());
        LibrariesService = pb.LibrariesService;
    });

    describe('LibrariesService.getBowerDefaults', function() {

        it('should return the correct default Bower settings', function() {
            var settings = LibrariesService.getBowerDefaults();
            settings.should.be.an.Object();
            settings.should.deepEqual({
                jquery: '/bower_components/jquery/dist/jquery.min.js',
                jquery_ui_js: '/bower_components/jqueryui/jquery-ui.min.js',
                jquery_ui_css: '/bower_components/jqueryui/themes/ui-lightness/jquery-ui.min.css',
                jquery_ui_touch_punch: '/bower_components/jqueryui-touch-punch/jquery.ui.touch-punch.min.js',
                jquery_file_upload_js: '/bower_components/jquery-file-upload/js/jquery.fileupload.js',
                jquery_file_upload_css: '/bower_components/jquery-file-upload/css/jquery.fileupload.css',
                jquery_iframe_transport: '/bower_components/jquery.iframe-transport/jquery.iframe-transport.js',
                jquery_datetime_picker_js: '/bower_components/datetimepicker/jquery.datetimepicker.js',
                jquery_datetime_picker_css: '/bower_components/datetimepicker/jquery.datetimepicker.css',
                jquery_validate: '/bower_components/jquery.validation/dist/jquery.validate.min.js',
                bootstrap_js: '/bower_components/bootstrap/dist/js/bootstrap.min.js',
                bootstrap_css: '/bower_components/bootstrap/dist/css/bootstrap.min.css',
                font_awesome: '/bower_components/fontawesome/css/font-awesome.min.css',
                angular: '/bower_components/angular/angular.min.js',
                angular_route: '/bower_components/angular-route/angular-route.min.js',
                angular_sanitize: '/bower_components/angular-sanitize/angular-sanitize.min.js',
                spin: '/bower_components/jquery.spinjs/libs/spin/spin.js',
                jquery_spin: '/bower_components/jquery.spinjs/dist/jquery.spin.min.js',
                he: '/bower_components/he/he.js',
                to_markdown: '/bower_components/to-markdown/src/to-markdown.js',
                markdown: '/bower_components/markdown/lib/markdown.js',
                angular_upload: '/bower_components/danialfarid-angular-file-upload/dist/angular-file-upload.min.js',
                angular_upload_shim: '/bower_components/danialfarid-angular-file-upload/dist/angular-file-upload-shim.min.js',
                ng_sortable_css: '/bower_components/ng-sortable/dist/ng-sortable.min.css',
                ng_sortable_style_css: '/bower_components/ng-sortable/dist/ng-sortable.style.min.css',
                ng_sortable_js: '/bower_components/ng-sortable/dist/ng-sortable.min.js',
                rangy: '/bower_components/rangy-release/rangy-core.min.js',
                rangy_saverestore: '/bower_components/rangy-release/rangy-selectionsaverestore.js'
            });
        });
    });
    
    describe('LibrariesService.getCDNDefaults', function() {

        it('should return the correct default CDN settings', function() {
            var settings = LibrariesService.getCDNDefaults();
            settings.should.be.an.Object();
            settings.should.deepEqual({
                jquery: '//code.jquery.com/jquery-1.11.1.min.js',
                jquery_ui_js: '//code.jquery.com/ui/1.10.4/jquery-ui.min.js',
                jquery_ui_css: '//code.jquery.com/ui/1.10.4/themes/ui-lightness/jquery-ui.css',
                jquery_ui_touch_punch: '//cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js',
                jquery_file_upload_js: '/js/lib/jquery/jquery.fileupload.js',
                jquery_file_upload_css: '/css/lib/jquery/jquery.fileupload.css',
                jquery_iframe_transport: '/js/lib/jquery/jquery.iframe-transport.js',
                jquery_datetime_picker_js: '/js/lib/jquery/jquery.datetimepicker.min.js',
                jquery_datetime_picker_css: '/css/lib/jquery/jquery.datetimepicker.min.css',
                jquery_validate: '//ajax.aspnetcdn.com/ajax/jquery.validate/1.12.0/jquery.validate.min.js',
                bootstrap_js: '//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js',
                bootstrap_css: '//maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css',
                font_awesome: '//netdna.bootstrapcdn.com/font-awesome/4.2.0/css/font-awesome.min.css',
                angular: '//ajax.googleapis.com/ajax/libs/angularjs/1.2.15/angular.min.js',
                angular_route: '//ajax.googleapis.com/ajax/libs/angularjs/1.2.15/angular-route.min.js',
                angular_sanitize: '//ajax.googleapis.com/ajax/libs/angularjs/1.2.15/angular-sanitize.min.js',
                spin: '//fgnass.github.io/spin.js/spin.min.js',
                jquery_spin: '//fgnass.github.io/spin.js/jquery.spin.js',
                he: '/js/lib/he/he.js',
                to_markdown: '/js/lib/to_markdown/to-markdown.js',
                markdown: '/js/lib/markdown/lib/markdown.js',
                angular_upload: '//cdnjs.cloudflare.com/ajax/libs/danialfarid-angular-file-upload/1.6.1/angular-file-upload.min.js',
                angular_upload_shim: '//cdnjs.cloudflare.com/ajax/libs/danialfarid-angular-file-upload/1.6.1/angular-file-upload-shim.min.js',
                ng_sortable_css: '/css/lib/ng-sortable/ng-sortable.min.css',
                ng_sortable_style_css: '/css/lib/ng-sortable/ng-sortable.style.min.css',
                ng_sortable_js: '/js/lib/ng-sortable/ng-sortable.min.js',
                rangy: '//cdnjs.cloudflare.com/ajax/libs/rangy/1.3.0/rangy-core.min.js',
                rangy_saverestore: '//cdnjs.cloudflare.com/ajax/libs/rangy/1.3.0/rangy-selectionsaverestore.min.js'
            });
        });
    });
});
