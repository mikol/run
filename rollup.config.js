import babelrc from 'babelrc-rollup'
import babel from 'rollup-plugin-babel'
import cleanup from 'rollup-plugin-cleanup'

const {distPathname, pkg} = require('./scripts/constants')

export default {
  input: 'run',
  output: {
    banner:
`#!/usr/bin/env node

// run v${pkg.version} (${new Date().toISOString()})
// https://github.com/mikol/run
// http://creativecommons.org/licenses/by/4.0/
`,
    file: distPathname,
    format: 'cjs'
  },
  plugins: [
    babel(babelrc({
      addModuleOptions: false
    })),
    (function rmEol() {
      return Object.assign({}, cleanup({extensions: '*', maxEmptyLines: 1}), {
        // `babel()` adds boilerplate with excess new lines to the generated
        // bundle, and `cleanup()` doesn’t define `transformBundle()` so it
        // doesn’t remove all new lines as expected. Which is why we define our
        // own `transformBundle()` and remove new lines here as well.
        transformBundle: (source) => ({
          code: source.replace(/(?:\r\n?|\n){3,}/g, '\n\n'),
          map: null
        })
      })
    }())
  ]
}
