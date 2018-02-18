import babelrc from 'babelrc-rollup'
import babel from 'rollup-plugin-babel'
import cleanup from 'rollup-plugin-cleanup'

const {
  binPathname,
  license,
  mainPathname,
  url,
  version
} = require('./scripts/vars.js')

const babelOptions = babelrc({
  addModuleOptions: false
})

const banner =
`#!/usr/bin/env node

// run v${version} (${new Date().toISOString()})
// ${url}
// ${license}
`

export default [
  {
    input: 'run',
    output: {
      banner,
      file: binPathname,
      format: 'cjs'
    },
    plugins: [
      babel(babelOptions)
    ]
  },
  {
    input: 'runner.js',
    output: {
      banner,
      file: mainPathname,
      format: 'cjs'
    },
    plugins: [
      babel(babelOptions),
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
]
