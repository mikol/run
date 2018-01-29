import babelrc from 'babelrc-rollup'
import babel from 'rollup-plugin-babel'
import cleanup from 'rollup-plugin-cleanup'
import commonjs from 'rollup-plugin-commonjs'

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
    commonjs({
      include: 'run',
      sourceMap: false
    }),
    cleanup({
      extensions: '*',
      include: 'run',
      maxEmptyLines: 1
    })
  ]
}
