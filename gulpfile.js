// Utilities
var autoprefixer = require('autoprefixer');
var cssnano = require('cssnano');
var fs = require('fs');

// Gulp
var gulp = require('gulp');
const {series, parallel, src, dest, lastRun, watch} = require('gulp');
// Gulp plugins
const plumber = require('gulp-plumber');
const browserSync = require('browser-sync').create();
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var header = require('gulp-header');
var postcss = require('gulp-postcss');
var rename = require('gulp-rename');
var runSequence = require('run-sequence');

// Misc/global vars
var pkg = JSON.parse(fs.readFileSync('package.json'));
var activatedAnimations = activateAnimations();

// Task options
var opts = {
  destPath: './',
  concatName: 'animate.css',

  autoprefixer: {
    cascade: false,
  },

  minRename: {
    suffix: '.min',
  },
};

// ----------------------------
// Gulp task definitions
// ----------------------------

gulp.task('createCSS', function() {
  return gulp
    .src(activatedAnimations)
    .pipe(concat(opts.concatName))
    .pipe(postcss([autoprefixer(opts.autoprefixer)]))
    .pipe(gulp.dest(opts.destPath))
    .pipe(postcss([cssnano({reduceIdents: {keyframes: false}})]))
    .pipe(rename(opts.minRename))
    .pipe(gulp.dest(opts.destPath));
});

gulp.task('addHeader', function() {
  return gulp
    .src('*.css')
    .pipe(header(opts.banner, pkg))
    .pipe(gulp.dest(opts.destPath));
});

const browserSyncOption = {
  port: 3000,
  open: true,
  ghostMode: false,
  server: {
    baseDir: './',
    index: 'index.html',
  },
  reloadOnRestart: true,
};

function browsersync(done) {
  browserSync.init(browserSyncOption);
  done();
}

function watchFnc(done) {
  const browserReload = () => {
    browserSync.reload();
    done();
  };
  watch('./index.html').on('change', series(browserReload));
  watch('./animate-config.json').on('change', series('createCSS', 'addHeader', browserReload));
  watch('./source/**/*.css').on('change', series('createCSS', 'addHeader', browserReload));
  watch('./images/**/*.{jpg,png,gif,svg}').on('change', series(browserReload));
}

gulp.task('default', gulp.series('createCSS', 'addHeader', parallel(browsersync, watchFnc)));

// ----------------------------
// Helpers/functions
// ----------------------------

// Read the config file and return an array of the animations to be activated
function activateAnimations() {
  var categories = JSON.parse(fs.readFileSync('animate-config.json')),
    category,
    files,
    file,
    target = [],
    count = 0;

  for (category in categories) {
    if (categories.hasOwnProperty(category)) {
      files = categories[category];

      for (file in files) {
        if (files[file]) {
          // marked as true
          target.push('source/' + category + '/' + file + '.css');
          count += 1;
        }
      }
    }
  }
  // prepend base CSS
  target.push('source/_base.css');

  if (!count) {
    gutil.log('No animations activated.');
  } else {
    gutil.log(count + (count > 1 ? ' animations' : ' animation') + ' activated.');
  }

  return target;
}
