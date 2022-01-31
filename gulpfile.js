const gulp = require('gulp');
const del = require('del');
const ts = require('gulp-typescript');

const files = ['src/**/*.ts', '!src/**/*.spec.ts'];

const build = () => {
  const tsProject = ts.createProject('tsconfig.json');
  return gulp.src(files).pipe(tsProject()).pipe(gulp.dest('lib'));
};

const clean = () => del('lib/');

const cleanCoverage = () => del('coverage/');

const defaultTask = gulp.series(clean, build);

exports.build = build;
exports.clean = clean;
exports.cleanCoverage = cleanCoverage;
exports.default = defaultTask;
