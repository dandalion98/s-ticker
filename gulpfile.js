let gulp = require('gulp'),
    path = require('path'),
    mocha = require('gulp-mocha'),
    gulpLoadPlugins = require('gulp-load-plugins'),
    runSequence = require('run-sequence'),
    plugins = gulpLoadPlugins({
        rename: {
            'gulp-angular-templatecache': 'templateCache'
        }
    });

gulp.task('default', function (done) {
    runSequence('env:dev', 'nodemon', done);
});

gulp.task('sample', function (done) {
    runSequence('env:dev', 'nodemonSample', done);
});

gulp.task('prod', function (done) {
    runSequence('env:prod', 'nodemon', done);
});

gulp.task('env:dev', function () {
    process.env.NODE_ENV = 'development';
});

gulp.task('env:prod', function () {
    process.env.NODE_ENV = 'production';
});

gulp.task('test', function (done) {
    console.log("starting test: " + process.pid)

    var testSuites = ['tests/test.*.js'];
    var error;
    console.dir(testSuites)

    gulp.src(testSuites)
        .pipe(mocha({
            reporter: 'spec',
            timeout: 10000,
            exit: true
        }))
        .on('error', function (err) {
            console.log("err")
            error = err;
            log.error(error.stack)
        })
        .on('end', function () {
            console.log("end")
            return done(error);
        });
});

let watchAssets = ['app.js', '*.js', 'config/**/*.js', 'common_modules/**/*.js']

gulp.task('nodemon', function () {
    return plugins.nodemon({
        script: 'app.js',
        nodeArgs: [""],
        ext: 'js,html',
        verbose: true,
        watch: watchAssets
    });
});

gulp.task('nodemonSample', function () {
    return plugins.nodemon({
        script: 'samples/client.js',
        nodeArgs: [""],
        ext: 'js,html',
        verbose: true,
        watch: watchAssets
    });
});