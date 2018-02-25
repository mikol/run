const {
  binPathname
} = require('./scripts/vars')

module.exports = {
  // ---------------------------------------------------------------------------
  // Dist

  predist: `mkdir -p dist`,
  dist: 'rollup -c',
  postdist: `chmod 755 ${binPathname}`,
  watchdist: 'run dist -- --watch',

  // ---------------------------------------------------------------------------

  echo: console.log,
  // echo: 'echo',

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
