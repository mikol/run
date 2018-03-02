const Module = require('module')
const path = require('path')

const PATH = process.env.PATH
const _chdir = process.chdir
const _load = Module._load

const wd = process.cwd()
const Runner = require(require('../scripts/vars').mainPathname)

const moduleRoot = path.join(__dirname, 'echo')

describe('module', () => {
  afterEach(() => {
    process.env.PATH = PATH
    process.chdir(wd)
  })

  it('receives error', () => {
    const runner = new Runner({
      moduleRoot,
      scriptName: 'throw',
      unscannedArguments: []
    })

    let received
    runner.on('error', (error) => {
      received = error
    })

    runner.run()

    expect(received.message).to.equal('Erroneous monk!')
  })

  it('receives error if script isn’t found', () => {
    const runner = new Runner({
      moduleRoot,
      scriptName: '!',
      unscannedArguments: []
    })

    let received
    runner.on('error', (error) => {
      received = error
    })

    runner.run()

    expect(received).to.match(/: Script ! is not defined /)
  })

  it('receives list', () => {
    const runner = new Runner({
      moduleRoot,
      scriptName: null,
      unscannedArguments: []
    })

    let received = false
    runner.on('list', () => {
      received = true
    })

    runner.run()

    expect(received).to.be.true
  })

  it('receives run', () => {
    const runner = new Runner({
      moduleRoot,
      scriptName: 'noop',
      unscannedArguments: ['Hello,', 'World!']
    })

    let received
    runner.on('run', (spec) => {
      received = spec
    })

    runner.run()

    expect(received).to.eql({
      name: 'echo',
      version: '2.3.5',
      wd: moduleRoot,
      script: 'noop("Hello,", "World!")'
    })
  })

  describe('process.chdir()', () => {
    beforeEach(() => {
      process.chdir = () => {
        process.chdir = _chdir
        throw new Error('ENOPE: Nope')
      }
    })

    it('can’t change directories', () => {
      const runner = new Runner({
        moduleRoot,
        scriptName: 'noop',
        unscannedArguments: []
      })

      let received
      runner.on('error', (error) => {
        received = error
      })

      runner.run()

      expect(received).to.endWith('ENOPE: Nope')
    })
  })

  describe('require package.json and scripts.js', () => {
    beforeEach(() => {
      Module._load = () => {
        throw {code: 'MODULE_NOT_FOUND'}
      }
    })

    afterEach(() => {
      Module._load = _load
    })

    it('can’t find scripts', () => {
      const runner = new Runner({
        moduleRoot,
        scriptName: 'noop',
        unscannedArguments: []
      })

      let received
      runner.on('error', (error) => {
        received = error
      })

      runner.run()

      expect(received).to.match(/: Did not find /)
    })
  })
})
