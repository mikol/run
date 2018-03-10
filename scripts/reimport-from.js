const fs = require('fs')

const importFrom = require('./import-from')

/**
 * Loads an ES6 module from a .js-suffixed file into a CJS module using rollup,
 * ignoring any cached version of the imported module so that it will be
 * re-initialized.
 *
 * @param {string} moduleId - A pathname identifying the module to import.
 *
 * @return {<Promise>Module} A promise for the imported module.
 */
module.exports = function reimportFrom(moduleId) {
  const realPathname = fs.realpathSync(moduleId)
  delete require.cache[realPathname]
  return importFrom(realPathname)
}
