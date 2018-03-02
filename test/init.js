const chai = require('chai')
const {spawnSync} = require('child_process')
const path = require('path')

const run = `${path.resolve(process.cwd(), 'dist', 'run')}`

chai.use(require('chai-string'))

global.expect = chai.expect

global.runRun = (moduleRoot, argv) => {
  const INIT_CWD = process.env.INIT_CWD

  process.env.INIT_CWD = moduleRoot

  const {
    error,
    status,
    stderr,
    stdout
  } = spawnSync(run, argv)

  process.env.INIT_CWD = INIT_CWD

  if (error) {
    throw error
  }

  if (status) {
    throw new Error(`${status}: ${stderr}`)
  }

  return `${stdout}`
}
