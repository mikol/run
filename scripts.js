const {
  binPathname,
  distPathname
} = require('./scripts/vars')

module.exports = {
  // ---------------------------------------------------------------------------
  // Dist

  predist: `mkdir -p ${distPathname}`,
  dist: 'rollup -c',
  postdist: `chmod 755 ${binPathname}`,
  watchdist: 'run dist -- --watch',

  // ---------------------------------------------------------------------------

  echo: console.log,

  // ---------------------------------------------------------------------------
  // Publish

  prepublish: 'run test',
  publish: 'npm publish',

  // ---------------------------------------------------------------------------
  // Test

  pretest: 'NODE_ENV=test run -q dist',
  test: "mocha -s 400 test/init.js './test/*.test.js' './test/**/*.test.js'",
  watchtest: 'run test -- --watch'

  // ---------------------------------------------------------------------------
}
