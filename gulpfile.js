/* eslint import/no-unresolved: 0 */

const { series, parallel, src, dest, watch } = require('gulp');
const autoprefixer = require('gulp-autoprefixer');
const babel = require('gulp-babel');
const buffer = require('vinyl-buffer');
const browserify = require('browserify');
const bSync = require('browser-sync').create();
const commonshake = require('common-shakeify');
const csso = require('gulp-csso');
const del = require('del');
const env = require('gulp-env');
const imagemin = require('gulp-imagemin');
const packflat = require('browser-pack-flat');
const pngquant = require('imagemin-pngquant');
const process = require('process');
const replace = require('gulp-replace');
const resolve = require('resolve');
const rigger = require('gulp-rigger');
const sass = require('gulp-sass');
const source = require('vinyl-source-stream');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-terser');
const watchify = require('watchify');

let appOrigin = 'https://app.topperoo.com';

if (process.env.APP_BASE_URL === undefined) {
    // Only load .env if there is no existing environment variables
    try {
        env({
            file: '.env',
            type: 'ini',
        });
    }
    catch (err) { /* Suppress errors */
    }
}

if (process.env.APP_BASE_URL !== undefined) {
    appOrigin = process.env.APP_BASE_URL;
}

function isDevelopMode () {
    return process.env.NODE_ENV === 'development' || process.env.APP_ENV === 'development';
}

function getNPMPackageIds () {
    // read package.json and get dependencies' package ids
    let packageManifest = {};
    try {
        packageManifest = require('./package.json');
    }
    catch (e) {
        // does not have a package.json manifest
    }
    return Object.keys(packageManifest.dependencies) || [];
}

function reload (done) {
    bSync.reload();
    done();
}

function serve (done) {
    bSync.init({
        proxy: {
            target: 'https://app.topperoo.test',
            ws: true,
        },
        port: 8080,
        online: false,
        open: false,
        reloadOnRestart: true,
    });
    done();
}

function clean (done) {
    return del([
        './public/css',
        './public/js',
        './public/img',
        './public/fonts',
        './public/views',
    ]);
}

function html () {
    return src('./Source/views/**/[^_]*.html')
        // Concat the markup
        .pipe(rigger()).on('error', console.error)

        // Output
        .pipe(dest('./public/views'));
}

function jsVendor () {
    let stream;

    // Initialize browserify
    let b = browserify({
        debug: true,
    });

    // Includes NPM packages on the bundle script
    getNPMPackageIds().forEach(function (id) {
        b.require(resolve.sync(id), { expose: id });
    });

    b.plugin(packflat);

    // Build and save into public folder
    stream = b
        .bundle().on('error', console.error)
        .pipe(source('vendor.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }));

    // Minify
    if (!isDevelopMode()) {
        stream.pipe(uglify({ safari10: true }));
    }

    return stream
        .pipe(sourcemaps.write('./'))
        .pipe(dest('./public/js/'));
}

function jsLoader () {
    let stream;
    stream = src(['./Source/js/loader.js'])
        .pipe(replace('{{APP_BASE_URL}}', appOrigin))
        .pipe(sourcemaps.init())
        .pipe(babel({ presets: ['@babel/env'] }));

    if (!isDevelopMode()) {
        stream.pipe(uglify({ safari10: true, mangle: false, compress: false }));
    }

    return stream.pipe(sourcemaps.write('./'))
        .pipe(dest('./public/js/'));
}

function jsApp (done, watching) {
    // Initialize browserify
    let b = browserify({
        entries: 'Source/js/main.js',
        debug: true,
        cache: {},
        packageCache: {},
    });

    // Create bundle function
    let bundle = () => {
        let stream;

        stream = b
            .bundle().on('error', console.error)
            .pipe(source('topperoo.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({ loadMaps: true }));

        // Minify
        if (!isDevelopMode()) {
            stream.pipe(uglify({ safari10: true }));
        }

        console.log('    ---    Create JS bundle');

        return stream
            .pipe(sourcemaps.write('./'))
            .pipe(dest('./public/js/'));
    };

    // Excludes NPM packages from the bundle script
    getNPMPackageIds().forEach(function (id) {
        b.external(id);
    });

    // Convert ES6 syntax to ES5 syntax
    b.transform('babelify', { presets: ['@babel/preset-env'] });

    // Replace all 'process.env.VAR' call in the source code into the value of VAR (actual string)
    b.transform('envify', { _: 'purge' });

    // Optimization
    b.plugin(commonshake);
    b.plugin(packflat);

    // If file watching is true
    if (typeof watching !== 'undefined' && watching === true) {
        b.plugin(watchify, { poll: 1200 });
        b.on('update', () => {
            bundle().on('end', () => bSync.reload());
        });
    }

    // Build and save to public  folder
    return bundle();
}

function css () {
    let stream;
    stream = src('./Source/scss/**/[^_]*.scss')
        // Replace variables with value from environment variables
        .pipe(replace(/\$app-base-url:.*;/, `\$app-base-url: "${appOrigin}";`))

        // Initialize sourcemaps
        .pipe(sourcemaps.init())

        // Compile sass
        .pipe(sass({ outputStyle: 'expanded' }).on('error', sass.logError))

        // Auto-prefix css styles for cross browser compatibility
        .pipe(autoprefixer());

    if (!isDevelopMode()) {
        // Minify css
        stream.pipe(csso({ restructure: false }));
    }

    stream = stream
        // Write sourcemaps to file
        .pipe(sourcemaps.write('./'))

        // Output
        .pipe(dest('./public/css/'))

        // Send to browser-sync
        .pipe(bSync.stream());

    return stream;
}

function images () {
    return src('./Source/img/**/*.*').pipe(imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        use: [pngquant()],
        interlaced: true,
    }))
        .pipe(dest('./public/img'));
}

function fonts () {
    return src('./Source/fonts/**/*').pipe(dest('./public/fonts/'));
}

function watchCss () {
    return watch(['Source/scss/**/*'], { usePolling: true, interval: 1200 }, series(css));
}

function watchHtml () {
    return watch(['Source/views/**/*'], { usePolling: true, interval: 1200 }, series(html, reload));
}

function watchJs (done) {
    return jsApp(done, true);
}

let compileAll = parallel(fonts, images, html, css, jsVendor, jsLoader, jsApp);
let watchAll = parallel(watchCss, watchHtml, watchJs);

exports.default = series(clean, compileAll);
exports.watch = series(clean, compileAll, watchAll);
exports.browsersync = series(clean, compileAll, serve, watchAll);
exports.js = parallel(jsVendor, jsLoader, jsApp);
