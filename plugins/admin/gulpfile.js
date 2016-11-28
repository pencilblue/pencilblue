var gulp = require('gulp');
var sass = require('gulp-sass');

gulp.task('build', function() {
  gulp.src('./sass/admin.scss')
    .pipe(sass())
    .pipe(gulp.dest('./public/css/'));
});
