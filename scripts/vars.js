const path = require('path')
const pkg = require(path.join(process.cwd(), 'package.json'))

module.exports = {
  binPathname: pkg.bin.run,
  license: 'http://creativecommons.org/licenses/by-sa/4.0/',
  mainPathname: pkg.main,
  url: pkg.repository,
  version: pkg.version
}
