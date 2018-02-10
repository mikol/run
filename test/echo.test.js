/* global expect, runRun */

const path = require('path')
const eol = require('os').EOL

describe('echo', () => {
  const INIT_CWD = path.join(__dirname, 'echo')

  it('prints script name and working directory', () => {
    const stdout = runRun(INIT_CWD, ['echo']).trim()
    const suffix = `> echo@2.3.5 ${INIT_CWD}${eol}> echo`

    expect(stdout).to.endWith(suffix)
  })

  it('echos nothing without unscanned options', () => {
    const stdout = runRun(INIT_CWD, ['echo']).trim()
    const suffix = '> echo'

    expect(stdout).to.endWith(suffix)
  })

  it('echos unscanned options', () => {
    const stdout = runRun(INIT_CWD, ['echo', '--', 'Hello,', 'World!']).trim()
    const suffix = `> echo "Hello," "World!"${eol}${eol}Hello, World!`

    expect(stdout).to.endWith(suffix)
  })

  it('echos unscanned options with unmatched double quote', () => {
    const stdout = runRun(INIT_CWD, ['echo', '--', 'Hello"World!']).trim()
    const suffix = `> echo "Hello\\"World!"${eol}${eol}Hello"World!`

    expect(stdout).to.endWith(suffix)
  })

  it('echos unscanned options with multiple double quotes', () => {
    const stdout = runRun(INIT_CWD, ['echo', '--', '"Hello"World"?']).trim()
    const suffix = `> echo "\\"Hello\\"World\\"?"${eol}${eol}"Hello"World"?`

    expect(stdout).to.endWith(suffix)
  })

  it('echos unscanned options with multiple single quotes', () => {
    const stdout = runRun(INIT_CWD, ['echo', '--', "'Hello'World'?"]).trim()
    const suffix = `> echo "'Hello'World'?"${eol}${eol}'Hello'World'?`

    expect(stdout).to.endWith(suffix)
  })

  it('echos prex', () => {
    const stdout = runRun(INIT_CWD, ['x']).trim()
    const regexp = new RegExp(`> echo pre${eol}{2}pre`)

    expect(stdout).to.match(regexp)
  })

  it('echos x', () => {
    const stdout = runRun(INIT_CWD, ['x']).trim()
    const regexp = new RegExp(`> run echo -- x${eol}{3}> echo@2.3.5 \\S.*?${eol}> echo "x"${eol}{2}x`)

    expect(stdout).to.match(regexp)
  })

  it('echos postx', () => {
    const stdout = runRun(INIT_CWD, ['x']).trim()
    const suffix = `> echo post${eol}${eol}post`

    expect(stdout).to.endWith(suffix)
  })
})
