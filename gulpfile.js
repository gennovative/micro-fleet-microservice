const gulp = require("gulp"),
    del = require("del"),
    tsc = require("gulp-typescript"),
    tsProject = tsc.createProject("tsconfig.json"),
    debug = require("gulp-debug"),
    tslint = require('gulp-tslint'),
    buffer = require('vinyl-buffer'),
    source = require('vinyl-source-stream');

const DIST_FOLDER = 'dist';

/**
 * Remove build directory.
 */
gulp.task('clean', () => {
    return del.sync([DIST_FOLDER]);
});



/**
 * Compile TypeScript sources in build directory.
 */
const TS_FILES = ['src/**/*.ts', 'typings/**/*.d.ts', '!node_modules/**/*.*', '!./**/*.spec.ts'];
gulp.task('compile', () => {

    var onError = function (err) {
        console.error(err.toString());
        this.emit('end');
    };

    return gulp.src(TS_FILES)
        .on('error', onError)
        .on('failed', onError)
        .pipe(development(debug()))
        .pipe(tsProject(tsc.reporter.fullReporter(true)))
        .pipe(gulp.dest(DIST_FOLDER))
    ;
});


/**
 * Lint
 */
const srcToLint = ['src/**/*.ts', '!node_modules/**/*.*', '!./**/*.spec.ts'];
gulp.task("tslint", () =>
    gulp.src(srcToLint)
        .pipe(tslint({
            formatter: "verbose"
        }))
        .pipe(tslint.report())
);


gulp.task('watch', ['tslint'], () => {
    return gulp.watch(TS_FILES, ['tslint', 'compile']);
});


/*
 * Default task which is automatically called by "gulp" command.
 */
gulp.task("default", ['clean', 'tslint', 'compile']);