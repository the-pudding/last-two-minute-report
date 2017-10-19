const gulp = require('gulp');
const rename = require('gulp-rename');
const browserSync = require('browser-sync');
const webpackStream = require('webpack-stream');
const plumber = require('gulp-plumber');
const report = require('../report-error.js');
const webpack = require('webpack');
const configDev = require('../webpack.config.dev.js');
const configProd = require('../webpack.config.prod.js');

const src = 'src/js/entry.js';
const srcEntry = 'src/js/entry.js';

gulp.task('js-dev', () =>
	gulp
		.src(srcEntry)
		.pipe(plumber({ errorHandler: report }))
		.pipe(webpackStream(configDev, webpack, (error, stats) => {
			const time = stats.toJson().time;
			console.log(`Built in ${time} ms.`);
		}))
		.pipe(rename('bundle.js'))
		.pipe(gulp.dest('dist/dev'))
		.pipe(browserSync.reload({ stream: true })));

gulp.task('js-dev-critical', () =>
	gulp
		.src('src/js/critical.js')
		.pipe(plumber({ errorHandler: report }))
		.pipe(webpackStream(configDev))
		.pipe(rename('critical.js'))
		.pipe(gulp.dest('dist/dev'))
		.pipe(browserSync.reload({ stream: true })));

gulp.task('js-prod', () =>
	gulp
		.src(srcEntry)
		.pipe(webpackStream(configProd, webpack, (error, stats) => {
			const time = stats.toJson().time;
			console.log(`Built in ${time} ms.`);
		}))
		.pipe(rename('bundle.js'))
		.pipe(gulp.dest('dist/prod')));

gulp.task('js-prod-critical', () =>
	gulp
		.src('src/js/critical.js')
		.pipe(webpackStream(configProd))
		.pipe(rename('critical.js'))
		.pipe(gulp.dest('.tmp')));
