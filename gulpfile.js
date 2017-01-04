const gulp = require("gulp"),
	del = require("del"),
	tsc = require("gulp-typescript"),
	tsProject = tsc.createProject("tsconfig.json"),
	debug = require("gulp-debug"),
	tslint = require('gulp-tslint'),
	buffer = require('vinyl-buffer'),
	source = require('vinyl-source-stream'),
	mocha = require('gulp-mocha'),
	istanbul = require('gulp-istanbul');

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
const TS_FILES = ['src/**/*.ts', 'typings/**/*.d.ts', '!node_modules/**/*.*'];
gulp.task('compile', () => {

	var onError = function (err) {
		console.error(err.toString());
		this.emit('end');
	};

	return gulp.src(TS_FILES)
		.on('error', onError)
		.on('failed', onError)
		.pipe(tsProject(tsc.reporter.fullReporter(true)))
		.pipe(gulp.dest(DIST_FOLDER));
});

const TEST_FILES = ['dist/test/**/*.js'];
gulp.task('pre-test', ['compile'], function () {
	return gulp.src(TEST_FILES)
		// Covering files
		.pipe(istanbul())
		// Force `require` to return covered files
		.pipe(istanbul.hookRequire());
});

gulp.task('test', ['pre-test'], () => {
	gulp.src(TEST_FILES)
		// gulp-mocha needs filepaths so you can't have any plugins before it
		.pipe(mocha({reporter: 'spec'}))
		// Creating the reports after tests ran
		.pipe(istanbul.writeReports())
		// Enforce a coverage of at least 90%
		.pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } }))
		.once('error', () => {
			process.exit(1);
		});
});

/**
 * Lint
 */
const srcToLint = ['src/**/*.ts', '!node_modules/**/*.*'];
gulp.task("tslint", () =>
	gulp.src(srcToLint)
		.pipe(tslint({
			formatter: "verbose"
		}))
		.pipe(tslint.report())
);

/**
 * Copy all resources that are not TypeScript files into build directory.
 */
const RESRC_FILES = ['src/**/*', '!./**/*.ts'];
gulp.task('resources', () => {
	return gulp.src(RESRC_FILES)
		.pipe(gulp.dest(DIST_FOLDER));
});


gulp.task('watch', ['tslint'], () => {
    return gulp.watch(TS_FILES, ['tslint', 'compile']);
});


/*
 * Default task which is automatically called by "gulp" command.
 */
gulp.task("default", ['clean', 'tslint', 'resources', 'test']);