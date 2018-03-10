const path = require('path')
const rollup = require('rollup')

const reimportFrom = require('./scripts/reimport-from')
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
    process.env.NODE_ENV = 'test'

    return Promise.all([
      reimportFrom(varsPathname),
      reimportFrom('./rollup.config.js')
    ]).then(([, config]) => {
      const {spawn, spawnSync} = require('child_process')
      const {watch} = require('chokidar')

      const {distPathname, mainPathname} = require(varsPathname)
      const testPathname = path.resolve('test')

      const wdRegExp = new RegExp(`^${process.cwd()}/`)
      const rollupWatcher = rollup.watch(config)

      const runTest = () => {
        spawnSync('sh', ['-c', this.test], {stdio: 'inherit'})
      }

      const debounceTimeoutMilliseconds = 250

      let debounceTimeoutId
      let ready = false
      const watchRollupOnce = (event) => {
        if (!ready && event.code === 'END') {
          ready = true
          rollupWatcher.removeListener('event', watchRollupOnce)
          runTest()

          const testWatcher = watch(testPathname)
          const watchTestOnce = () => {
            testWatcher.on('all', (type, pathname) => {
              clearTimeout(debounceTimeoutId)
              debounceTimeoutId = setTimeout(runTest, debounceTimeoutMilliseconds)
            })
          }

          testWatcher.once('ready', watchTestOnce)
        }
      }

      rollupWatcher.on('event', watchRollupOnce)

      rollupWatcher.on('event', (event) => {
        switch (event.code) {
          case 'BUNDLE_END':
            const input = event.input
            const output = event.output
              .map((x) => x.replace(wdRegExp, ''))
              .join(`\n${new Array(input.length).join(' ')}`)

            console.log(input, '→', output)
            break
          case 'ERROR':
            console.error(event.error)
            break
          case 'FATAL':
            throw event.error
        }
      })
    })
  }

  // ---------------------------------------------------------------------------
}
