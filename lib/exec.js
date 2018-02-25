const {fork, spawn} = require('child_process')
const {constants: {signals}} = require('os')
const path = require('path')

const forkjs = path.join(__dirname, 'fork.js')

let child = null

Object.keys(signals).forEach((signal) => {
  // Ignore signals that can’t have a listener, can’t be sent, or that log warnings.
  if (!/^(?:SIGBREAK|SIGBUS|SIGCHLD|SIGFPE|SIGILL|SIGKILL|SIGPROF|SIGSEGV|SIGSTOP)$/.test(signal)) {
    process.on(signal, () => {
      if (child) {
        try {
          child.kill(signal)
        } catch (_) {
          // Ignore.
        }
      }
    })
  }
})

function on(resolve, reject, stdout, stderr) {
  child.once('error', (error) => {
    child = null
    reject({error})
  })

  child.once('exit', (code, signal) => {
    child = null

    if (code) {
      return reject({code})
    }

    if (signal) {
      return reject({signal})
    }

    resolve()
  })
}

function js(argv, resolve, reject) {
  child = fork(forkjs, argv, {stdio: 'inherit'})
  on(resolve, reject)
}

function sh(argv, resolve, reject) {
  child = spawn('sh', ['-c'].concat(argv), {stdio: 'inherit'})
  on(resolve, reject)
}

module.exports = {js, sh}
