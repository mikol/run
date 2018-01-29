const chai = require('chai')
const {spawnSync} = require('child_process')
const path = require('path')

process.env.PATH = `${path.resolve(process.cwd(), 'dist')}:${process.env.PATH}`

chai.use(require('chai-string'))

global.expect = chai.expect

global.runRun = (INIT_CWD, argv) => {
  const _INIT_CWD = process.env.INIT_CWD

  process.env.INIT_CWD = INIT_CWD

  const {
    error,
    status,
    stderr,
    stdout
  } = spawnSync('run', argv)

  process.env.INIT_CWD = _INIT_CWD

  if (error) {
    throw error
  }

  if (status) {
    throw new Error(`${status}: ${stderr}`)
  }

  return `${stdout}`
}
