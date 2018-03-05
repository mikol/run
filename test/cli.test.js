/* global expect, runRun, sinon */

const path = require('path')
const eol = require('os').EOL

const PATH = process.env.PATH
const wd = process.cwd()

const moduleRoot = path.join(__dirname, 'echo')

describe('cli', () => {
  afterEach(() => {
    process.env.PATH = PATH
    process.chdir(wd)
  })

  it('lists available scripts', () => {
    const stdout = runRun(moduleRoot).trim()
    const prefix = `run: ${moduleRoot} scripts:`

    expect(stdout).to.startWith(prefix)
    expect(stdout).to.match(/prex/)
    expect(stdout).to.match(/pree/)
  })

  it('prints usage', () => {
    const stdout = runRun(moduleRoot, ['--help']).trim()
    expect(stdout).to.match(/^Usage: run.*?<command> \[-- <args>\.{3}\]$/)
  })

  it('is quiet', () => {
    const stdout = runRun(moduleRoot, ['--quiet', 'echo']).trim()
    expect(stdout).to.match(/^$/)
  })

  it('rejects unknown options', () => {
    expect(() => runRun(moduleRoot, ['--fu'])).to.throw(/Unknown option: fu/)
  })

  describe('from package.json', () => {
    it('prints script name and working directory', () => {
      const stdout = runRun(moduleRoot, ['echo']).trim()
      const suffix = `> echo@2.3.5 ${moduleRoot}${eol}> echo`

      expect(stdout).to.endWith(suffix)
    })

    it('echos nothing without unscanned options', () => {
      const stdout = runRun(moduleRoot, ['echo']).trim()
      const suffix = '> echo'

      expect(stdout).to.endWith(suffix)
    })

    it('echos unscanned options', () => {
      const stdout = runRun(moduleRoot, ['echo', '--', 'Hello,', 'World!']).trim()
      const suffix = `> echo "Hello," "World!"${eol}${eol}Hello, World!`

      expect(stdout).to.endWith(suffix)
    })

    it('echos unscanned options with unmatched double quote', () => {
      const stdout = runRun(moduleRoot, ['echo', '--', 'Hello"World!']).trim()
      const suffix = `> echo "Hello\\"World!"${eol}${eol}Hello"World!`

      expect(stdout).to.endWith(suffix)
    })

    it('echos unscanned options with multiple double quotes', () => {
      const stdout = runRun(moduleRoot, ['echo', '--', '"Hello"World"?']).trim()
      const suffix = `> echo "\\"Hello\\"World\\"?"${eol}${eol}"Hello"World"?`

      expect(stdout).to.endWith(suffix)
    })

    it('echos unscanned options with multiple single quotes', () => {
      const stdout = runRun(moduleRoot, ['echo', '--', "'Hello'World'?"]).trim()
      const suffix = `> echo "'Hello'World'?"${eol}${eol}'Hello'World'?`

      expect(stdout).to.endWith(suffix)
    })

    it('echos prex', () => {
      const stdout = runRun(moduleRoot, ['x']).trim()
      const regexp = new RegExp(`> echo pre${eol}{2}pre`)

      expect(stdout).to.match(regexp)
    })

    it('echos x', () => {
      const stdout = runRun(moduleRoot, ['x']).trim()
      const regexp = new RegExp(`> run echo -- x${eol}{3}> echo@2.3.5 \\S.*?${eol}> echo "x"${eol}{2}x`)

      expect(stdout).to.match(regexp)
    })

    it('echos postx', () => {
      const stdout = runRun(moduleRoot, ['x']).trim()
      const suffix = `> echo post${eol}${eol}post`

      expect(stdout).to.endWith(suffix)
    })

    it('doesn’t log package', () => {
      const stdout = runRun(moduleRoot, ['-q', 'pkg']).trim()
      const unexpected = 'package'

      expect(stdout).not.to.equal(unexpected)
    })
  })

  describe('from scripts.js:', () => {
    it('prints script name and working directory', () => {
      const stdout = runRun(moduleRoot, ['log']).trim()
      const suffix = `> echo@2.3.5 ${moduleRoot}${eol}> log()`

      expect(stdout).to.endWith(suffix)
    })

    it('logs nothing without unscanned options', () => {
      const stdout = runRun(moduleRoot, ['log']).trim()
      const suffix = '> log()'

      expect(stdout).to.endWith(suffix)
    })

    it('logs unscanned options', () => {
      const stdout = runRun(moduleRoot, ['log', '--', 'Hello,', 'World!']).trim()
      const suffix = `> log("Hello,", "World!")${eol}${eol}Hello, World!`

      expect(stdout).to.endWith(suffix)
    })

    it('logs unscanned options with unmatched double quote', () => {
      const stdout = runRun(moduleRoot, ['log', '--', 'Hello"World!']).trim()
      const suffix = `> log("Hello\\"World!")${eol}${eol}Hello"World!`

      expect(stdout).to.endWith(suffix)
    })

    it('logs unscanned options with multiple double quotes', () => {
      const stdout = runRun(moduleRoot, ['log', '--', '"Hello"World"?']).trim()
      const suffix = `> log("\\"Hello\\"World\\"?")${eol}${eol}"Hello"World"?`

      expect(stdout).to.endWith(suffix)
    })

    it('logs unscanned options with multiple single quotes', () => {
      const stdout = runRun(moduleRoot, ['log', '--', "'Hello'World'?"]).trim()
      const suffix = `> log("'Hello'World'?")${eol}${eol}'Hello'World'?`

      expect(stdout).to.endWith(suffix)
    })

    it('logs pree', () => {
      const stdout = runRun(moduleRoot, ['e']).trim()
      const regexp = new RegExp(`> pree\\(\\)${eol}{2}pre`)

      expect(stdout).to.match(regexp)
    })

    it('logs e', () => {
      const stdout = runRun(moduleRoot, ['e']).trim()
      const regexp = new RegExp(`> run log -- e${eol}{3}> echo@2.3.5 \\S.*?${eol}> log\\("e"\\)${eol}{2}e`)

      expect(stdout).to.match(regexp)
    })

    it('logs poste', () => {
      const stdout = runRun(moduleRoot, ['e']).trim()
      const suffix = `> poste()${eol}${eol}post`

      expect(stdout).to.endWith(suffix)
    })

    it('logs scripts', () => {
      const stdout = runRun(moduleRoot, ['-q', 'pkg']).trim()
      const expected = 'scripts'

      expect(stdout).to.equal(expected)
    })

    it('closes over functions', () => {
      const stdout = runRun(moduleRoot, ['-q', 'closure']).trim()
      const expected = 'true'

      expect(stdout).to.equal(expected)
    })

    describe('async', () => {
      it('waits for promises', () => {
        // NOTE: Scripts run in a spawned child process. Their global timers
        // (e.g., `setTimeout()`) cannot be mocked using sinon. :¬(
        const stdout = runRun(moduleRoot, ['-q', 'wait']).trim()

        return new Promise((resolve, reject) => {
          const dates = stdout.split(/\r\n?|\n/).map((x) => new Date(x))
          const actual = dates[1] - dates[0]

          try {
            expect(actual).to.be.within(100, 200)
          } catch (error) {
            reject(error)
          }

          resolve()
        })
      })
    })
  })
})
