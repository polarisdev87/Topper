var gulp = require('gulp');
var jshint = require('gulp-jshint');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var map = require("map-stream");

function replaceUrl () {
    return map((file, cb) => {
        let fileContents = file.contents.toString();
        fileContents = fileContents.replace(/https:\/\/app\.topperoo\.test/g, 'https://fe.topperoo.com');

        // eslint-disable-next-line
        file.contents = Buffer.from(fileContents);

        cb(null, file);
    });
}

gulp.task('copy', [ 'copy-fonts', 'copy-images', 'copy-schematics', 'copy-preview-frames' ]);
gulp.task('build', [ 'css', 'js', 'js-admin', 'copy' ]);
gulp.task('default', [ 'build' ]);

gulp.task('jshint', function() {
    return gulp.src('./source/js/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('css', function() {
    return gulp.src('./source/scss/themes/**/main.scss')
        .pipe(sass({ outputStyle: 'compressed' }).on('error', sass.logError))
        .pipe(postcss([ autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }) ]))
        .pipe(replaceUrl())
        .pipe(gulp.dest('./public/css/'));
});

gulp.task('js', function() {
    return gulp.src([
        './source/js/noConflictA.js',
        './source/js/vendor/jQuery-2.2.4.min.js',
        './source/js/noConflictB.js',
        './source/js/vendor/jquery-ui-1.10.4.custom.min.js',
        './source/js/vendor/mustache.min.js',
        './source/js/vendor/raphael.min.js',
        './source/js/vendor/base64.min.js',
        './source/js/plugins.min.js',
        './source/js/vendor/plugins/jquery.mCustomScrollbar.min.js',
        './node_modules/svg.js/dist/svg.min.js',
        './source/js/vendor/colors.js',
        './source/js/modules/color_picker.js',
        './source/js/modules/api.js',
        './source/js/modules/config.js',
        './source/js/modules/template.js',
        './source/js/modules/editor.js',
        './source/js/modules/dashboard.js',
        './source/js/modules/design.js',
        './source/js/modules/lightbox.js',
        './source/js/modules/object.js',
        './source/js/modules/order.js',
        './source/js/modules/products.js',
        './source/js/modules/storage.js',
        './source/js/modules/utils.js',
        './source/js/modules/viewport.js',
        './source/js/app.js'
    ]).pipe(concat('topperoo.js'))
    .pipe(replaceUrl())
    .pipe(gulp.dest('./public/js/'));
});

gulp.task('js-admin', function() {
    return gulp.src([
        './source/js/noConflictA.js',
        './source/js/vendor/jQuery-2.2.4.min.js',
        './source/js/noConflictB.js',
        './source/js/vendor/jquery-ui-1.10.4.custom.min.js',
        './source/js/vendor/mustache.min.js',
        './source/js/vendor/raphael.min.js',
        './source/js/vendor/base64.min.js',
        './source/js/plugins.min.js',
        './source/js/vendor/plugins/jquery.mCustomScrollbar.min.js',
        './node_modules/svg.js/dist/svg.min.js',
        './source/js/vendor/colors.js',
        './source/js/modules/color_picker.js',
        './source/js/admin/modules/config.js',
        './source/js/admin/modules/utils.js',
        './source/js/modules/api.js',
        './source/js/modules/config.js',
        './source/js/modules/template.js',
        './source/js/modules/editor.js',
        './source/js/modules/dashboard.js',
        './source/js/modules/design.js',
        './source/js/modules/lightbox.js',
        './source/js/modules/object.js',
        './source/js/modules/order.js',
        './source/js/modules/products.js',
        './source/js/modules/storage.js',
        './source/js/modules/utils.js',
        './source/js/modules/viewport.js',
        './source/js/admin/app.js'
    ]).pipe(concat('topperooadmin.js'))
    .pipe(replaceUrl())
    .pipe(gulp.dest('./public/js/'));
});

gulp.task('copy-fonts', function () {
    return gulp.src('./source/fonts/**/*')
        .pipe(gulp.dest('./public/fonts/'));
});

gulp.task('copy-images', function () {
    return gulp.src('./source/img/**/*')
        .pipe(gulp.dest('./public/img/'));
});

gulp.task('copy-schematics', function () {
    return gulp.src('./source/schematics/**/*')
        .pipe(gulp.dest('./public/schematics/'));
});

gulp.task('copy-preview-frames', function () {
    return gulp.src('./source/tpl_backgrounds/**/*')
        .pipe(gulp.dest('./public/tpl_backgrounds/'));
});

gulp.task('watch', function() {
    gulp.watch('./source/js/**/*.js', [ 'jshint' ]);
});
