var del = require('del');
var gulp = require('gulp');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var less = require('gulp-less');
var minifyCss = require('gulp-minify-css');
var runSequence = require('run-sequence');

var vendorFiles;
var jsDirectory;
var cssDirectory;

gulp.task('build:admin', function() {
  vendorFiles = [
    './public/bower_components/moment/min/moment.min.js',
    './public/bower_components/jquery/dist/jquery.min.js',
    './public/bower_components/angular/angular.min.js',
    './public/bower_components/angular-route/angular-route.min.js',
    './public/bower_components/angular-sanitize/angular-sanitize.min.js',
    './public/bower_components/angular-resource/angular-resource.min.js',
    './public/bower_components/bootstrap/dist/js/bootstrap.min.js',
    './public/bower_components/moment-picker/dist/angular-moment-picker.min.js'

    /*'./public/bower_components/to-markdown/dist/to-markdown.js',
    './public/bower_components/markdown/bin/md2html.js',
    './public/bower_components/danialfarid-angular-file-upload/dist/ng-file-upload-all.js',
    './public/bower_components/ng-sortable/dist/ng-sortable.min.js',
    './public/bower_components/rangy-release/rangy-core.js',
    './public/bower_components/rangy-release/rangy-selectionsaverestore.min.js'*/
  ];

  jsDirectory = 'public/js/admin-new/compiled/';
  cssDirectory = 'public/css/admin-new/';

  runSequence(
    'clean',
    'minify',
    'less'
  );
});

gulp.task('clean', function(cb) {
  del.sync([
    jsDirectory + '**/*',
    cssDirectory + '**/*'
  ]);
  cb();
});

gulp.task('minify', function() {
  gulp.src(vendorFiles)
    .pipe(sourcemaps.init())
    .pipe(concat('vendor.min.js'))
    .pipe(uglify())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./' + jsDirectory));

  gulp.src(vendorFiles)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest('./' + jsDirectory));
});

gulp.task('less', function() {
  gulp.src('./less/admin/main.less')
    .pipe(less({compress: true}))
    .pipe(minifyCss({keepBreaks: false}))
    .pipe(rename(function(path) {
      path.extname = '.min.css';
    }))
    .pipe(gulp.dest('./' + cssDirectory));
});
