const {spawnSync} = require('child_process')
const {Script} = require('vm')

let script

function js(argv) {
  try {
    if (!script) {
      const filename = argv[0]
      const source = `((r,s,a,m)=>{m=r('${filename}');m[s].apply(m,a)})`

      script = new Script(source, {filename})
    }

    script.runInThisContext()(require, argv[1], argv.slice(2))
    return {}
  } catch (error) {
    return {error}
  }
}

function sh(argv) {
  return spawnSync('sh', ['-c'].concat(argv), {stdio: 'inherit'})
}

module.exports = {js, sh}
