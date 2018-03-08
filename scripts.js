const path = require('path')

const varsPathname = path.resolve('./scripts/vars.js')
const {
  binPathname,
  distPathname,
  mainPathname
} = require(varsPathname)

module.exports = {
  // ---------------------------------------------------------------------------
  // Dist

  predist: `mkdir -p ${distPathname}`,
  dist: 'rollup -c',
  postdist: `chmod 755 ${binPathname}`,

  // ---------------------------------------------------------------------------
  // Publish

  prepublish: 'run test',
  publish: 'npm publish',

  // ---------------------------------------------------------------------------
  // Test

  pretest: 'NODE_ENV=test run -q dist',
  test: "mocha -s 400 test/init.js './test/*.test.js' './test/**/*.test.js'",
  watchtest() {
    delete require.cache[varsPathname] // Force `vars` to be reinitialized.

    process.env.NODE_ENV = 'test'

    const {spawn, spawnSync} = require('child_process')
    const {watch} = require('fs')

    const {distPathname, mainPathname} = require(varsPathname)
    const testPathname = path.resolve('test')

    // XXX: Run dist synchronously once to ensure that `test/dist` is populated.
    spawnSync('sh', ['-c', 'run dist'], {stdio: 'ignore'})

    spawn('sh', ['-c', 'run -q dist -- --watch'], {stdio: 'inherit'})

    const distWatcher = watch(mainPathname)
    distWatcher.once('change', () => {
      // Wait for `mainPathname` to change (it’s the last file to be changed by
      // rollup), then add a listener for subsequent `test` directory changes.

      distWatcher.close()

      let n = 0
      watch(testPathname, {recursive: true}, () => {
        // XXX: `watch()` initially generates two change events for
        // `mainPathname`. Ignore the first one.
        if (n > 0) {
          spawnSync('sh', ['-c', this.test], {stdio: 'inherit'})
        } else {
          n++
        }
      })
    })
  }

  // ---------------------------------------------------------------------------
}
