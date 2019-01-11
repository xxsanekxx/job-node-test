const gulp = require('gulp');
const mocha = require('gulp-mocha');
const eslint = require('gulp-eslint');
const { argv } = require('yargs');
const testSetup = require('./backend/test/setup');

gulp.task('lint', () => gulp.src(argv.path || argv.p || ['./gulpfile.js', 'backend/**/*.js'])
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failAfterError()));

gulp.task('unit-test', (done) => {
  process.env.TEST = true;
  // todo decide (fixtures or sequelize seed)
  testSetup().then(() => {
    const tests = gulp.src(argv.path || argv.p || ['backend/test/unit/**/*.js']).pipe(mocha());
    tests.once('error', (err) => {
      done(err);
    }).once('end', () => {
      done();
    });
  }).catch((err) => {
    done(err);
  });
});
