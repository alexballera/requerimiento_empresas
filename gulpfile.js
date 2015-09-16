var gulp          = require('gulp'),
    sass          = require('gulp-ruby-sass'),
    autoprefixer  = require('gulp-autoprefixer'),
    minifycss     = require('gulp-minify-css'),
    jshint        = require('gulp-jshint'),
    uglify        = require('gulp-uglify'),
    imagemin      = require('gulp-imagemin'),
    rename        = require('gulp-rename'),
    concat        = require('gulp-concat'),
    notify        = require('gulp-notify'),
    cache         = require('gulp-cache'),
    browserSync   = require('browser-sync'),
    minifyHTML    = require('gulp-minify-html'),
    reload        = browserSync.reload,
    del           = require('del'),
    deploy        = require('gulp-gh-pages'),
    uncss         = require('gulp-uncss'),
    inject        = require('gulp-inject'),
    wiredep       = require('wiredep').stream;

var globs = {
  sass: './app/styles/sass/styles.scss',
  css: './app/styles/css/styles.css',
  js: './app/scripts/main.js',
  scripts: './app/scripts/js/**',
  vendors: './app/scripts/vendors/**',
  html: './app/index.html',
  image: './app/images/**',
  fonts: './app/styles/fonts/**',
  folder: [
    'dist/styles/css',
    'dist/scripts/js',
    'dist/images',
    'app/styles/css',
    'app/scripts/js',
    'app/images',
    'dist'
  ]
};

// Serve
gulp.task('serve', function () {
  'use strict';
  browserSync({
    notify: false,
    logPrefix: 'BrowserSync',
    server: __dirname + '/app'
  });
});

//Deploy to gh-pages (GitHub)
gulp.task('deploy', function () {
  'use strict';
  return gulp.src('./dist/**/*')
    .pipe(deploy());
});

// HTML
gulp.task('html', function() {
  'use strict';
  var opts = {
    conditionals: true,
    spare:true
  };
  return gulp.src(globs.html)
    .pipe(minifyHTML(opts))
    .pipe(gulp.dest(globs.folder[6]))
    .pipe(notify({ message: 'HTML task complete' }));
});

// Styles
gulp.task('styles', function() {
  'use strict';
  return sass(globs.sass, { style: 'expanded' })
    .pipe(autoprefixer('last 2 version'))
    // .pipe(gulp.dest(globs.folder[0]))
    // .pipe(gulp.dest(globs.folder[3]))
    .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(gulp.dest(globs.folder[0]))
    .pipe(gulp.dest(globs.folder[3]))
    .pipe(notify({ message: 'Styles task complete' }));
});

// Optimiza styles.min.css
gulp.task('uncss',  function()  {
    return gulp.src('./dist/styles/css/style.min.css')
        .pipe(uncss({
            html: './app/index.html'
        }))
        .pipe(gulp.dest('./dist/styles/css'));
});

// Scripts
gulp.task('scripts', function() {
  'use strict';
  return gulp.src(globs.js)
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    .pipe(concat('main.js'))
    // .pipe(gulp.dest(globs.folder[1]))
    // .pipe(gulp.dest(globs.folder[4]))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest(globs.folder[1]))
    .pipe(gulp.dest(globs.folder[4]))
    .pipe(notify({ message: 'Scripts task complete' }));
});

// Vendors to dist
gulp.task('vendors', function () {
  'use strict';
  return gulp.src(['app/scripts/vendors/**'])
    .pipe(gulp.dest('dist/scripts/vendors/'));
});

// Fonts to dist
gulp.task('fonts', function () {
  'use strict';
  return gulp.src(['app/styles/fonts/**'])
    .pipe(gulp.dest('dist/styles/fonts'))
    .pipe(notify({ message: 'Fonts task complete' }));
});

// Images
gulp.task('images', function() {
  'use strict';
  return gulp.src(globs.image)
    .pipe(cache(imagemin({ optimizationLevel: 3, progressive: true, interlaced: true })))
    .pipe(gulp.dest(globs.folder[2]));
    // .pipe(notify({ message: 'Images task complete' }));
});

// Inyectando css y js al index.html
gulp.task('inject', function () {
  'use strict';
  gulp.src('./app/**/*.html')
  .pipe(inject(gulp.src(['./app/scripts/vendors/**.js', './app/scripts/js/**.js', './app/styles/css/**.css'], {read: false}), {relative: true}))
  .pipe(gulp.dest('./app'));
});

// Inyectando las librerias Bower
gulp.task('wiredep',  function  ()  {
    gulp.src('./app/index.html')
        .pipe(wiredep({
          directory: './app/lib'
        }))
        .pipe(gulp.dest('./app'));
});

// Clean
gulp.task('clean', function(cb) {
  'use strict';
    del([globs.css, globs.folder[1] + '/main.js'], cb);
});

// Watch
gulp.task('watch', function() {
  'use strict';
  gulp.watch(globs.sass, ['styles', 'uncss']);
  gulp.watch(globs.js, ['scripts']);
  gulp.watch(globs.vendors, ['vendors']);
  gulp.watch(globs.image, ['images']);
  gulp.watch(globs.html, ['html']);
  gulp.watch(globs.fonts, ['fonts']);
  gulp.watch(globs.html).on('change', reload);
  gulp.watch(globs.sass).on('change', reload);
  gulp.watch(globs.js).on('change', reload);
  gulp.watch(['./bower.json'],  ['wiredep']);
});

// Default task
gulp.task('default', ['serve', 'inject', 'wiredep', 'watch'], function() {
});
