const eol = require('os').EOL
const path = require('path')

const pkg = require(path.join(process.cwd(), 'package.json'))

const distDirname = 'dist'
const runBasename = 'run'
const distPathname = path.join(distDirname, runBasename)

module.exports = {
  distDirname,
  distPathname,
  eol,
  pkg,
  runBasename
}
