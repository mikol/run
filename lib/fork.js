const pathname = process.argv[2]
const scriptName = process.argv[3]
const argv = process.argv.slice(4)

require(pathname)[scriptName].apply(null, argv)
