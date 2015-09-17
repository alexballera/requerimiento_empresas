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
    wiredep       = require('wiredep').stream,
    pngquant      = require('imagemin-pngquant'),
    bower         = require('gulp-bower');

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
    'dist/images/',
    'app/styles/css',
    'app/scripts/js',
    'app/images',
    'dist'
  ]
};

// Serve
gulp.task('serve', ['install'], function () {
  'use strict';
  browserSync({
    notify: false,
    logPrefix: 'BS',
    server: {
      baseDir: 'app'
    },
    port: 9000,
    ui: {
      port: 9001
    }
  });
});
gulp.task('serve:dist', ['install'], function () {
  'use strict';
  browserSync({
    notify: false,
    logPrefix: 'BS',
    server: {
      baseDir: 'dist'
    },
    port: 4000,
    ui: {
      port: 4001
    }
  });
});

//Deploy to gh-pages (GitHub)
gulp.task('deploy', function () {
  'use strict';
  return gulp.src('./dist/**/*')
    .pipe(deploy());
});

// Bower Install
gulp.task('bower-install', function () {
  'use strict';
    return bower({ cmd: 'install', cwd: './app' })
        .pipe(gulp.dest('app/bower_components'));
});
// Bower Update
gulp.task('bower-update', ['bower-install'], function () {
  'use strict';
    return bower({ cmd: 'update', cwd: './app' })
        .pipe(gulp.dest('app/bower_components'));
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
    .pipe(rename({ suffix: '.min' }))
    .pipe(minifycss())
    .pipe(gulp.dest(globs.folder[0]))
    .pipe(gulp.dest(globs.folder[3]))
    .pipe(notify({ message: 'Styles task complete' }));
});

// Optimiza styles.min.css
gulp.task('uncss',  function()  {
  'use strict';
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
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest(globs.folder[1]))
    .pipe(gulp.dest(globs.folder[4]))
    .pipe(notify({ message: 'Scripts task complete' }));
});

// Copiando vendors, lib y fonts a dist
gulp.task('copy', function () {
  'use strict';
  gulp.src(['app/scripts/vendors/**'])
    .pipe(gulp.dest('dist/scripts/vendors/'));
  gulp.src(['app/styles/fonts/**'])
    .pipe(gulp.dest('dist/styles/fonts'));
  gulp.src(['app/bower_components/**'])
    .pipe(gulp.dest('dist/bower_components/'));
  gulp.src(['bower.json'])
    .pipe(gulp.dest('./app'));
});

// Images
gulp.task('images', function() {
  'use strict';
  return gulp.src(globs.image)
    .pipe(cache(imagemin({ 
      optimizationLevel: 3, 
      progressive: true, 
      interlaced: true,
      use: [pngquant()]
    })))
    .pipe(gulp.dest(globs.folder[2]));
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
  'use strict';
    gulp.src('./app/index.html')
        .pipe(wiredep({
          directory: './app/bower_components'
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
  gulp.watch(globs.vendors, ['copy']);
  gulp.watch(globs.fonts, ['copy']);
  gulp.watch('bower.json', ['copy']);
  gulp.watch(globs.image, ['images']);
  gulp.watch(globs.html, ['html']);
  gulp.watch(globs.image).on('change', reload);
  gulp.watch(globs.html).on('change', reload);
  gulp.watch(globs.sass).on('change', reload);
  gulp.watch(globs.js).on('change', reload);
  gulp.watch(['./bower.json'],  ['wiredep', 'copy']);
});

// Install
gulp.task('install', ['inject', 'bower-install', 'wiredep', 'copy', 'images'], function() {
});

// Update
gulp.task('update', ['inject', 'bower-update', 'wiredep', 'copy', 'images'], function() {
});

// Server task
gulp.task('server', ['serve:dist', 'watch'], function() {
});

// Default task
gulp.task('default', ['serve', 'watch'], function() {
});
