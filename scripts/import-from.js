const fs = require('fs')
const path = require('path')
const rollup = require('rollup')

/**
 * Loads an ES6 module from a .js-suffixed file into a CJS module using rollup.
 *
 * @param {string} moduleId - A pathname identifying the module to import.
 *
 * @return {<Promise>Module} A promise for the imported module.
 */
module.exports = function importFrom(moduleId) {
  const realPathname = fs.realpathSync(moduleId)

  return rollup.rollup({
    input: realPathname,
    external: (id) => (id[0] !== '.' && !path.isAbsolute(id)) || /\.json$/.test(id)
  }).then((bundle) => {
    return bundle.generate({format: 'cjs'})
  }).then(({code}) => {
    const defaultLoader = require.extensions['.js']

    require.extensions['.js'] = (module, pathname) => {
      if (pathname === realPathname) {
        (module)._compile(code, pathname)
      } else {
        defaultLoader(module, pathname)
      }
    }

    const m = require(realPathname)

    require.extensions['.js'] = defaultLoader

    return m
  })
}
