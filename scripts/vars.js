const path = require('path')
const pkg = require(path.join(process.cwd(), 'package.json'))

const binBasename = path.basename(pkg.bin.run)
const binDirname = path.dirname(pkg.bin.run)

const mainBasename = path.basename(pkg.main)
const mainDirname = path.basename(path.dirname(pkg.main))

const distPathname = process.env.NODE_ENV === 'test'
  ? path.resolve(path.join('test', binDirname))
  : path.resolve(binDirname)

const vars = {
  binPathname: path.join(distPathname, binBasename),
  distPathname,
  license: 'http://creativecommons.org/licenses/by-sa/4.0/',
  mainPathname: path.join(distPathname, mainDirname, mainBasename),
  url: pkg.repository,
  version: pkg.version
}

module.exports = vars
