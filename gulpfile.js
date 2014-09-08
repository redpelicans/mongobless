var gulp = require('gulp')
  , gutil = require('gulp-util')
  , mocha = require('gulp-mocha');

gulp.task('mocha', function() {
  return gulp.src('test/*.js', {read: false})
    .pipe(mocha({ reporter: 'spec' })) 
    .on('error', gutil.log);
});


gulp.task('watch-mocha', function() {
  gulp.watch('test/**', ['mocha']); 
});

