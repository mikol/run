const path = require('path')

const PATH = process.env.PATH

const wd = process.cwd()
const Runner = require(path.join(wd, 'dist', 'lib', 'runner'))

const moduleRoot = path.join(__dirname, 'echo')
const scriptName = 'noop'
const unscannedArguments = ['Hello,', 'World!']

describe('environment', () => {
  const expectByVariable = {
    NODE: (value) => expect(value).to.equal(process.execPath),
    PATH: (value) => expect(value).to.startWith(runner.dotBin),
    npm_lifecycle_event: (value) => expect(value).to.equal(scriptName),
    npm_lifecycle_script: (value) =>
      expect(value).to.equal(`${scriptName}("${unscannedArguments.join('", "')}")`),
    npm_node_execpath: (value) => expect(value).to.equal(process.execPath),
    npm_package_gitHead: (value) => expect(value).to.match(/^[a-f0-9]{40}$/),
    run_event: (value) => expect(value).to.equal(scriptName),
    run_execpath: (value) => expect(value).to.equal(runner.execPath),
    run_script: (value) =>
      expect(value).to.equal(`${scriptName}("${unscannedArguments.join('", "')}")`)
  }

  function makeExpect(variable) {
    return () => {
      expectByVariable[variable](process.env[variable])
    }
  }

  let runner
  before(() => {
    runner = new Runner({moduleRoot, scriptName, unscannedArguments})
    runner.run()
  })

  after(() => {
    process.env.PATH = PATH
    process.chdir(wd)
  })

  for (variable in expectByVariable) {
    it(`${variable}`, makeExpect(variable))
  }
})
