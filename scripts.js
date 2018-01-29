const {
  distDirname,
  distPathname
} = require('./scripts/constants')

module.exports = {
  // ---------------------------------------------------------------------------
  // Dist

  predist: `mkdir -p ${distDirname}`,
  dist: 'rollup -c',
  postdist: `chmod 755 ${distPathname}`,
  watchdist: 'run dist -- --watch',

  // ---------------------------------------------------------------------------

  echo: console.log,

  // ---------------------------------------------------------------------------
  // Publish

  prepublish: 'run test',
  publish: 'npm publish',

  // ---------------------------------------------------------------------------
  // Test

  pretest: 'run dist',
  test: "mocha -s 400 test/init.js './test/*.test.js' './test/**/*.test.js'",
  watchtest: 'run test -- --watch'

  // ---------------------------------------------------------------------------
}
