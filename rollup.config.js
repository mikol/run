import babelrc from 'babelrc-rollup'
import babel from 'rollup-plugin-babel'
import cleanup from 'rollup-plugin-cleanup'

const {
  binPathname,
  distPathname,
  license,
  mainPathname,
  url,
  version
} = require('./scripts/vars.js')

const babelOptions = babelrc({
  addModuleOptions: false
})

const cleanupOptions = {
  extensions: '*',
  maxEmptyLines: 1
}

const shebang = `\
#!/usr/bin/env node

`

const banner = `\
// run v${version} (${new Date().toISOString()})
// ${url}
// ${license}
`

function rmEol(cleanup) {
  return Object.assign({}, cleanup, {
    // `babel()` adds boilerplate with excess new lines to the generated
    // bundle, and `cleanup()` doesn’t define `transformBundle()` so it
    // doesn’t remove all new lines as expected. Which is why we define our
    // own `transformBundle()` and remove new lines here as well.
    transformBundle: (source) => ({
      code: source.replace(/(?:\r\n?|\n){3,}/g, '\n\n'),
      map: null
    })
  })
}

export default [
  {
    input: 'run',
    output: {
      banner: `${shebang}${banner}\nconst version = 'v${version}'\n`,
      file: binPathname,
      format: 'cjs'
    },
    plugins: [
      babel(babelOptions)
    ]
  },
  {
    input: 'lib/argv-parser.js',
    output: {
      banner,
      file: `${distPathname}/lib/argv-parser.js`,
      format: 'cjs'
    },
    plugins: [
      babel(babelOptions),
      rmEol(cleanup(cleanupOptions))
    ]
  },
  {
    input: 'lib/exec.js',
    output: {
      banner,
      file: `${distPathname}/lib/exec.js`,
      format: 'cjs'
    },
    plugins: [
      babel(babelOptions)
    ]
  },
  {
    input: 'lib/runner.js',
    output: {
      banner,
      file: mainPathname,
      format: 'cjs'
    },
    plugins: [
      babel(babelOptions),
      rmEol(cleanup(cleanupOptions))
    ]
  }
]
